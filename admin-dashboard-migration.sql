-- Admin Dashboard Migration for Where The Cat?
-- This migration adds admin functionality and fixes any signup issues

-- First, ensure the profiles table exists with proper structure
DO $$ 
BEGIN
    -- Check if profiles table exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        CREATE TABLE profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT,
            full_name TEXT,
            avatar_url TEXT,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created profiles table';
    ELSE
        -- Add is_admin column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'is_admin'
        ) THEN
            ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Added is_admin column to profiles table';
        END IF;
    END IF;
END $$;

-- Ensure cats table has all necessary columns for admin management
DO $$
BEGIN
    -- Add admin_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cats' AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE cats ADD COLUMN admin_notes TEXT;
        RAISE NOTICE 'Added admin_notes column to cats table';
    END IF;

    -- Add last_updated_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cats' AND column_name = 'last_updated_by'
    ) THEN
        ALTER TABLE cats ADD COLUMN last_updated_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added last_updated_by column to cats table';
    END IF;

    -- Ensure status column has all necessary values
    BEGIN
        ALTER TABLE cats DROP CONSTRAINT IF EXISTS cats_status_check;
        ALTER TABLE cats ADD CONSTRAINT cats_status_check 
            CHECK (status IN ('active', 'rescued', 'adopted', 'inactive', 'archived', 'duplicate', 'inappropriate'));
        RAISE NOTICE 'Updated status constraint on cats table';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Status constraint already exists or could not be updated';
    END;
END $$;

-- Create admin_actions table for audit trail
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'status_change')),
    target_type TEXT NOT NULL CHECK (target_type IN ('cat', 'user', 'profile')),
    target_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_cats_status ON cats(status);
CREATE INDEX IF NOT EXISTS idx_cats_last_updated_by ON cats(last_updated_by);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);

-- Enable RLS on admin_actions table
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (updated to include admin access)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Updated cats policies to include admin access
DROP POLICY IF EXISTS "Anyone can view active cats" ON cats;
DROP POLICY IF EXISTS "Authenticated users can insert their own cats" ON cats;
DROP POLICY IF EXISTS "Anonymous users can insert anonymous cats" ON cats;
DROP POLICY IF EXISTS "Users can update their own cats" ON cats;
DROP POLICY IF EXISTS "Users can delete their own cats" ON cats;
DROP POLICY IF EXISTS "Admins can view all cats" ON cats;
DROP POLICY IF EXISTS "Admins can update all cats" ON cats;
DROP POLICY IF EXISTS "Admins can delete all cats" ON cats;

-- Cats policies (public viewing)
CREATE POLICY "Anyone can view active cats" ON cats
    FOR SELECT USING (status = 'active');

-- Cats policies (admin access to all cats)
CREATE POLICY "Admins can view all cats" ON cats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can update all cats" ON cats
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can delete all cats" ON cats
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Cats policies (user access)
CREATE POLICY "Authenticated users can insert their own cats" ON cats
    FOR INSERT WITH CHECK (
        (auth.uid() = user_id AND reporter_type = 'authenticated') OR
        (user_id IS NULL AND reporter_type = 'anonymous')
    );

CREATE POLICY "Users can update their own cats" ON cats
    FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can delete their own cats" ON cats
    FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Admin actions policies
CREATE POLICY "Admins can view all admin actions" ON admin_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can insert admin actions" ON admin_actions
    FOR INSERT WITH CHECK (
        auth.uid() = admin_id AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Function to handle new user profile creation (updated)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, is_admin)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        FALSE  -- Default to non-admin
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action_type TEXT,
    p_target_type TEXT,
    p_target_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    action_id UUID;
BEGIN
    INSERT INTO admin_actions (
        admin_id,
        action_type,
        target_type,
        target_id,
        old_values,
        new_values,
        notes
    ) VALUES (
        auth.uid(),
        p_action_type,
        p_target_type,
        p_target_id,
        p_old_values,
        p_new_values,
        p_notes
    ) RETURNING id INTO action_id;
    
    RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND is_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a default admin user (update the email to your email)
-- You'll need to manually set is_admin = TRUE for your user after signup
-- Example: UPDATE profiles SET is_admin = TRUE WHERE email = 'your-email@example.com';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Final verification
DO $$
BEGIN
    RAISE NOTICE 'Admin dashboard migration completed successfully!';
    RAISE NOTICE 'To create an admin user:';
    RAISE NOTICE '1. Sign up normally through the app';
    RAISE NOTICE '2. Run: UPDATE profiles SET is_admin = TRUE WHERE email = ''your-email@example.com'';';
END $$;
