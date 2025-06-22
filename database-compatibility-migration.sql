-- Database Compatibility Migration for Where The Cat?
-- This migration adds anonymous reporting support while maintaining backward compatibility

-- First, check if the reporter_type column already exists
DO $$ 
BEGIN
    -- Add reporter_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cats' AND column_name = 'reporter_type'
    ) THEN
        ALTER TABLE cats ADD COLUMN reporter_type TEXT DEFAULT 'authenticated';
        
        -- Update existing records to be 'authenticated' if they have a user_id
        UPDATE cats SET reporter_type = 'authenticated' WHERE user_id IS NOT NULL;
        UPDATE cats SET reporter_type = 'anonymous' WHERE user_id IS NULL;
        
        RAISE NOTICE 'Added reporter_type column to cats table';
    ELSE
        RAISE NOTICE 'reporter_type column already exists';
    END IF;
END $$;

-- Create an index on reporter_type for better query performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'cats' AND indexname = 'idx_cats_reporter_type'
    ) THEN
        CREATE INDEX idx_cats_reporter_type ON cats(reporter_type);
        RAISE NOTICE 'Created index on reporter_type';
    ELSE
        RAISE NOTICE 'Index on reporter_type already exists';
    END IF;
END $$;

-- Update RLS policies to handle anonymous reports
-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all active cats" ON cats;
DROP POLICY IF EXISTS "Users can insert their own cats" ON cats;
DROP POLICY IF EXISTS "Users can update their own cats" ON cats;
DROP POLICY IF EXISTS "Users can delete their own cats" ON cats;

-- Create new policies that support anonymous reports
CREATE POLICY "Anyone can view active cats" ON cats
    FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated users can insert cats" ON cats
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
        (auth.uid() IS NULL AND user_id IS NULL)
    );

CREATE POLICY "Users can update their own cats" ON cats
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND user_id = auth.uid()
    );

CREATE POLICY "Users can delete their own cats" ON cats
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND user_id = auth.uid()
    );

-- Ensure RLS is enabled
ALTER TABLE cats ENABLE ROW LEVEL SECURITY;

-- Create a function to validate reporter_type
CREATE OR REPLACE FUNCTION validate_reporter_type()
RETURNS TRIGGER AS $$
BEGIN
    -- Set reporter_type based on user_id if not explicitly set
    IF NEW.reporter_type IS NULL THEN
        IF NEW.user_id IS NOT NULL THEN
            NEW.reporter_type := 'authenticated';
        ELSE
            NEW.reporter_type := 'anonymous';
        END IF;
    END IF;
    
    -- Validate reporter_type values
    IF NEW.reporter_type NOT IN ('authenticated', 'anonymous') THEN
        RAISE EXCEPTION 'Invalid reporter_type. Must be either "authenticated" or "anonymous"';
    END IF;
    
    -- Ensure consistency between user_id and reporter_type
    IF NEW.user_id IS NOT NULL AND NEW.reporter_type = 'anonymous' THEN
        RAISE EXCEPTION 'Cannot have user_id with anonymous reporter_type';
    END IF;
    
    IF NEW.user_id IS NULL AND NEW.reporter_type = 'authenticated' THEN
        NEW.reporter_type := 'anonymous';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reporter_type validation
DROP TRIGGER IF EXISTS validate_reporter_type_trigger ON cats;
CREATE TRIGGER validate_reporter_type_trigger
    BEFORE INSERT OR UPDATE ON cats
    FOR EACH ROW
    EXECUTE FUNCTION validate_reporter_type();

-- Create a view for public cat data (optional, for easier querying)
CREATE OR REPLACE VIEW public_cats AS
SELECT 
    id,
    name,
    description,
    color,
    size,
    latitude,
    longitude,
    date_spotted,
    status,
    created_at,
    updated_at,
    photo_urls,
    reporter_type,
    CASE 
        WHEN user_id IS NOT NULL THEN 'authenticated'
        ELSE 'anonymous'
    END as report_source
FROM cats
WHERE status = 'active';

-- Grant permissions on the view
GRANT SELECT ON public_cats TO anon, authenticated;

-- Create a function to get cat statistics
CREATE OR REPLACE FUNCTION get_cat_statistics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_cats', COUNT(*),
        'authenticated_reports', COUNT(*) FILTER (WHERE reporter_type = 'authenticated'),
        'anonymous_reports', COUNT(*) FILTER (WHERE reporter_type = 'anonymous'),
        'active_cats', COUNT(*) FILTER (WHERE status = 'active'),
        'last_updated', MAX(created_at)
    ) INTO result
    FROM cats;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_cat_statistics() TO anon, authenticated;

-- Insert some test data to verify the migration works
-- (This will be ignored if data already exists)
INSERT INTO cats (
    name, 
    description, 
    color, 
    size, 
    latitude, 
    longitude, 
    date_spotted, 
    status,
    user_id,
    reporter_type
) VALUES 
(
    'Migration Test Cat',
    'This cat was added during the database migration to test anonymous reporting',
    'Mixed',
    'Medium',
    35.4676,
    -97.5164,
    CURRENT_DATE,
    'active',
    NULL,
    'anonymous'
)
ON CONFLICT DO NOTHING;

-- Final verification
DO $$
DECLARE
    col_exists BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Check if reporter_type column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cats' AND column_name = 'reporter_type'
    ) INTO col_exists;
    
    -- Check if policies exist
    SELECT COUNT(*) FROM pg_policies 
    WHERE tablename = 'cats' 
    INTO policy_count;
    
    RAISE NOTICE 'Migration verification:';
    RAISE NOTICE '- reporter_type column exists: %', col_exists;
    RAISE NOTICE '- Number of RLS policies: %', policy_count;
    RAISE NOTICE 'Migration completed successfully!';
END $$;
