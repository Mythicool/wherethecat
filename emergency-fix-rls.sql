-- Emergency fix for infinite recursion in RLS policies
-- This removes all problematic admin policies and keeps only basic user policies
-- Run this in your Supabase SQL Editor immediately to fix the issue

-- Step 1: Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Step 2: Drop ALL existing admin policies on cats table
DROP POLICY IF EXISTS "Admins can view all cats" ON cats;
DROP POLICY IF EXISTS "Admins can update all cats" ON cats;
DROP POLICY IF EXISTS "Admins can delete all cats" ON cats;

-- Step 3: Drop the problematic is_admin function
DROP FUNCTION IF EXISTS is_admin(UUID);

-- Step 4: Create simple, safe policies for profiles (no admin functionality for now)
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 5: Ensure cats table has only the basic policies (no admin policies)
-- Keep existing user policies, but make sure they don't reference profiles table

-- Check if the basic cats policies exist, if not create them
DO $$
BEGIN
  -- Check if the basic SELECT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cats' AND policyname = 'Anyone can view active cats'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view active cats" ON cats FOR SELECT USING (status = ''active'')';
  END IF;

  -- Check if the authenticated INSERT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cats' AND policyname = 'Authenticated users can insert their own cats'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can insert their own cats" ON cats FOR INSERT WITH CHECK (auth.uid() = user_id AND reporter_type = ''authenticated'')';
  END IF;

  -- Check if the anonymous INSERT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cats' AND policyname = 'Anonymous users can insert anonymous cats'
  ) THEN
    EXECUTE 'CREATE POLICY "Anonymous users can insert anonymous cats" ON cats FOR INSERT WITH CHECK (user_id IS NULL AND reporter_type = ''anonymous'')';
  END IF;

  -- Check if the UPDATE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cats' AND policyname = 'Users can update their own cats'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own cats" ON cats FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL)';
  END IF;

  -- Check if the DELETE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cats' AND policyname = 'Users can delete their own cats'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete their own cats" ON cats FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL)';
  END IF;
END $$;

-- Step 6: Verify the fix by checking current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'cats')
ORDER BY tablename, policyname;

SELECT 'Emergency RLS fix completed! The infinite recursion should be resolved.' as status;
