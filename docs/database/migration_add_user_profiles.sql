-- Migration: Add User Profiles
-- Description: Create user_profiles table for storing extended user information
-- Version: 1.0.0
-- Date: 2025-11-01

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
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

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;

-- Create RLS policies for user_profiles
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

-- Storage policies for user-avatars bucket
DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

CREATE POLICY "Users can view their own avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = 'avatars');

CREATE POLICY "Users can upload their own avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = 'avatars' AND auth.uid()::text = (storage.filename(name)).split('-')[1]);

CREATE POLICY "Users can update their own avatars"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = 'avatars' AND auth.uid()::text = (storage.filename(name)).split('-')[1]);

CREATE POLICY "Users can delete their own avatars"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = 'avatars' AND auth.uid()::text = (storage.filename(name)).split('-')[1]);

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_profiles_updated_at_trigger ON user_profiles;

-- Create trigger to update updated_at column
CREATE TRIGGER update_user_profiles_updated_at_trigger
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Create function to auto-initialize user profile on signup
CREATE OR REPLACE FUNCTION initialize_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-initialize profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_profile();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- Add helpful comments
COMMENT ON TABLE user_profiles IS 'Extended user profile information including preferences and personal details';
COMMENT ON COLUMN user_profiles.user_id IS 'References auth.users table';
COMMENT ON COLUMN user_profiles.avatar_url IS 'URL to user avatar image stored in Supabase Storage';
COMMENT ON COLUMN user_profiles.bio IS 'User biography or description (max 500 characters)';
COMMENT ON COLUMN user_profiles.theme_preference IS 'User preferred theme: light, dark, or system';
COMMENT ON COLUMN user_profiles.email_notifications IS 'Whether user wants to receive email notifications';
COMMENT ON COLUMN user_profiles.push_notifications IS 'Whether user wants to receive push notifications';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'User profiles migration completed successfully!';
    RAISE NOTICE 'Storage bucket "user-avatars" created';
    RAISE NOTICE 'RLS policies enabled and configured';
    RAISE NOTICE 'Auto-initialization trigger created';
END $$;
