-- Migration: Add User Tour Preferences
-- Description: Create user_preferences table with tour tracking
-- Date: 2025-11-01

-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tour preferences
    tour_completed BOOLEAN DEFAULT FALSE,
    tour_completed_at TIMESTAMPTZ,
    tour_version TEXT DEFAULT '1.0.0',
    tours_viewed TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- General preferences (can be expanded later)
    currency TEXT DEFAULT 'USD',
    date_format TEXT DEFAULT 'MM/DD/YYYY',
    theme TEXT DEFAULT 'system',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one row per user
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own preferences"
    ON user_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
    ON user_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
    ON user_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
    ON user_preferences
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE user_preferences IS 'User-specific preferences and settings';
COMMENT ON COLUMN user_preferences.tour_completed IS 'Whether the user has completed the main application tour';
COMMENT ON COLUMN user_preferences.tour_completed_at IS 'When the user completed the main tour';
COMMENT ON COLUMN user_preferences.tour_version IS 'Version of the tour the user has seen';
COMMENT ON COLUMN user_preferences.tours_viewed IS 'Array of specific tours the user has viewed (budget, goals, etc)';
COMMENT ON COLUMN user_preferences.currency IS 'User preferred currency (USD, EUR, etc)';
COMMENT ON COLUMN user_preferences.date_format IS 'User preferred date format';
COMMENT ON COLUMN user_preferences.theme IS 'User theme preference (light, dark, system)';
COMMENT ON COLUMN user_preferences.notifications_enabled IS 'Whether notifications are enabled';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
    ON user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_tour_completed 
    ON user_preferences(user_id, tour_completed) 
    WHERE tour_completed = FALSE;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- Create function to initialize user preferences on signup
CREATE OR REPLACE FUNCTION initialize_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create preferences for new users
DROP TRIGGER IF EXISTS trigger_initialize_user_preferences ON auth.users;
CREATE TRIGGER trigger_initialize_user_preferences
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_preferences();

-- Migration complete
SELECT 'User preferences table created successfully' AS status;
