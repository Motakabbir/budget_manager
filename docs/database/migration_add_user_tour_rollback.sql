-- Rollback: Remove User Tour Preferences
-- Description: Rollback migration for user_preferences table
-- Date: 2025-11-01

-- Drop trigger first
DROP TRIGGER IF EXISTS trigger_initialize_user_preferences ON auth.users;
DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON user_preferences;

-- Drop functions
DROP FUNCTION IF EXISTS initialize_user_preferences();
DROP FUNCTION IF EXISTS update_user_preferences_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_user_preferences_tour_completed;
DROP INDEX IF EXISTS idx_user_preferences_user_id;

-- Drop policies
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;

-- Drop table
DROP TABLE IF EXISTS user_preferences CASCADE;

-- Rollback complete
SELECT 'User preferences table rolled back successfully' AS status;
