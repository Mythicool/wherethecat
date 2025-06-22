-- Supabase Database Setup for Where The Cat Application
-- Run these SQL commands in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cats table
CREATE TABLE cats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  color TEXT,
  size TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  date_spotted DATE,
  photo_urls TEXT[],
  reporter_type TEXT DEFAULT 'authenticated' CHECK (reporter_type IN ('authenticated', 'anonymous')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'rescued', 'adopted', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX cats_user_id_idx ON cats(user_id);
CREATE INDEX cats_location_idx ON cats(latitude, longitude);
CREATE INDEX cats_created_at_idx ON cats(created_at);
CREATE INDEX cats_status_idx ON cats(status);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cats ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Cats policies
CREATE POLICY "Anyone can view active cats" ON cats
  FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated users can insert their own cats" ON cats
  FOR INSERT WITH CHECK (auth.uid() = user_id AND reporter_type = 'authenticated');

CREATE POLICY "Anonymous users can insert anonymous cats" ON cats
  FOR INSERT WITH CHECK (user_id IS NULL AND reporter_type = 'anonymous');

CREATE POLICY "Users can update their own cats" ON cats
  FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can delete their own cats" ON cats
  FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cats_updated_at
  BEFORE UPDATE ON cats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for cat photos
INSERT INTO storage.buckets (id, name, public) VALUES ('cat-photos', 'cat-photos', true);

-- Storage policies for cat photos
CREATE POLICY "Anyone can view cat photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'cat-photos');

CREATE POLICY "Authenticated users can upload cat photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cat-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own cat photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'cat-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own cat photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'cat-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
