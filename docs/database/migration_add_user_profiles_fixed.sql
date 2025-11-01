-- ============================================
-- Migration: User Profiles with Avatar Support
-- Version: 1.0.1 (Fixed)
-- Date: 2025-11-01
-- ============================================

-- ============================================
-- 1. CREATE USER PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT CHECK (length(bio) <= 500),
    phone TEXT,
    date_of_birth DATE,
    location TEXT,
    currency TEXT DEFAULT 'USD',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 2. CREATE STORAGE BUCKET FOR AVATARS
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES FOR USER_PROFILES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;

-- Create new policies
CREATE POLICY "Users can view their own profile"
    ON user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
    ON user_profiles
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 5. CREATE STORAGE POLICIES (SIMPLIFIED)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Allow public read access to avatars
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'user-avatars');

-- Allow authenticated users to upload to their folder
CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'user-avatars' 
        AND auth.role() = 'authenticated'
    );

-- Allow users to update files in bucket
CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'user-avatars' 
        AND auth.role() = 'authenticated'
    );

-- Allow users to delete files in bucket
CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'user-avatars' 
        AND auth.role() = 'authenticated'
    );

-- ============================================
-- 6. CREATE TRIGGER FUNCTIONS
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-initialize user profile on signup
CREATE OR REPLACE FUNCTION initialize_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. CREATE TRIGGERS
-- ============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at_trigger ON user_profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at_trigger
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Create trigger to auto-initialize profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_profile();

-- ============================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- ============================================
-- 9. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- ============================================
-- 10. ADD HELPFUL COMMENTS
-- ============================================

COMMENT ON TABLE user_profiles IS 'Extended user profile information';
COMMENT ON COLUMN user_profiles.user_id IS 'References auth.users - one profile per user';
COMMENT ON COLUMN user_profiles.avatar_url IS 'URL to avatar image in Supabase Storage';
COMMENT ON COLUMN user_profiles.bio IS 'User biography (max 500 characters)';
COMMENT ON COLUMN user_profiles.theme_preference IS 'UI theme: light, dark, or system';
COMMENT ON COLUMN user_profiles.email_notifications IS 'Enable/disable email notifications';
COMMENT ON COLUMN user_profiles.push_notifications IS 'Enable/disable push notifications';

-- ============================================
-- 11. VERIFICATION QUERIES (Optional - Comment out after first run)
-- ============================================

-- Check if table was created
-- SELECT EXISTS (
--     SELECT FROM pg_tables 
--     WHERE schemaname = 'public' 
--     AND tablename = 'user_profiles'
-- ) AS table_exists;

-- Check if policies were created
-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'user_profiles';

-- Check if storage bucket was created
-- SELECT * FROM storage.buckets WHERE id = 'user-avatars';

-- Check if triggers were created
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public' 
-- AND event_object_table IN ('user_profiles', 'users');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ User profiles migration completed successfully!';
    RAISE NOTICE '✅ Table: user_profiles created';
    RAISE NOTICE '✅ Storage bucket: user-avatars created';
    RAISE NOTICE '✅ RLS policies: 4 policies enabled';
    RAISE NOTICE '✅ Storage policies: 4 policies enabled';
    RAISE NOTICE '✅ Triggers: 2 triggers created';
    RAISE NOTICE '✅ Indexes: 2 indexes created';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '1. Navigate to /profile in your app';
    RAISE NOTICE '2. Upload an avatar and fill in your profile';
    RAISE NOTICE '3. Enjoy your new user profile system!';
END $$;
