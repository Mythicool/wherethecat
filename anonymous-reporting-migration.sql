-- Migration script to enable anonymous cat reporting
-- Run this in your Supabase SQL Editor if you have an existing database

-- Step 1: Add reporter_type column to cats table
ALTER TABLE cats ADD COLUMN IF NOT EXISTS reporter_type TEXT DEFAULT 'authenticated' CHECK (reporter_type IN ('authenticated', 'anonymous'));

-- Step 2: Make user_id nullable (this will update existing constraint)
ALTER TABLE cats ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Update existing records to have reporter_type = 'authenticated'
UPDATE cats SET reporter_type = 'authenticated' WHERE reporter_type IS NULL;

-- Step 4: Drop existing RLS policies for cats
DROP POLICY IF EXISTS "Users can insert their own cats" ON cats;
DROP POLICY IF EXISTS "Users can update their own cats" ON cats;
DROP POLICY IF EXISTS "Users can delete their own cats" ON cats;

-- Step 5: Create new RLS policies that support anonymous reporting
CREATE POLICY "Authenticated users can insert their own cats" ON cats
  FOR INSERT WITH CHECK (auth.uid() = user_id AND reporter_type = 'authenticated');

CREATE POLICY "Anonymous users can insert anonymous cats" ON cats
  FOR INSERT WITH CHECK (user_id IS NULL AND reporter_type = 'anonymous');

CREATE POLICY "Users can update their own cats" ON cats
  FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can delete their own cats" ON cats
  FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Step 6: Update storage policies to allow anonymous photo uploads
-- Note: We'll need to modify the photo upload logic to handle anonymous users differently
CREATE POLICY "Anonymous users can upload cat photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cat-photos' AND (auth.uid() IS NOT NULL OR auth.uid() IS NULL));

-- Step 7: Create index for reporter_type for better performance
CREATE INDEX IF NOT EXISTS cats_reporter_type_idx ON cats(reporter_type);

-- Verification queries (optional - run these to verify the migration worked)
-- SELECT COUNT(*) as total_cats, reporter_type FROM cats GROUP BY reporter_type;
-- SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'cats' AND column_name IN ('user_id', 'reporter_type');
