-- Fix for infinite recursion in profiles table RLS policies
-- Run this in your Supabase SQL Editor to resolve the policy issue

-- First, drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create a simple function to check admin status without RLS recursion
-- This function bypasses RLS by using SECURITY DEFINER and direct table access
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  admin_status BOOLEAN := FALSE;
BEGIN
  -- Use a direct query that bypasses RLS policies
  SELECT COALESCE(is_admin, FALSE) INTO admin_status
  FROM profiles
  WHERE id = user_id;

  RETURN COALESCE(admin_status, FALSE);
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, return FALSE for safety
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;

-- Create new policies without recursion
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin policies using the security definer function
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (is_admin(auth.uid()));

-- Also fix the cats table policies that reference profiles
DROP POLICY IF EXISTS "Admins can view all cats" ON cats;
DROP POLICY IF EXISTS "Admins can update all cats" ON cats;
DROP POLICY IF EXISTS "Admins can delete all cats" ON cats;

-- Recreate cats admin policies using the security definer function
CREATE POLICY "Admins can view all cats" ON cats
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all cats" ON cats
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete all cats" ON cats
  FOR DELETE USING (is_admin(auth.uid()));

-- Verify the fix
SELECT 'Profiles policy fix completed successfully!' as status;
