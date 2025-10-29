-- Add notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    icon VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (
        priority IN (
            'low',
            'normal',
            'high',
            'urgent'
        )
    ),
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        read_at TIMESTAMP
    WITH
        TIME ZONE,
        expires_at TIMESTAMP
    WITH
        TIME ZONE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Row Level Security for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications FOR
SELECT USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;

CREATE POLICY "Users can insert own notifications" ON notifications FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can update own notifications" ON notifications FOR
UPDATE USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid () = user_id);

-- Add notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
    budget_alerts BOOLEAN DEFAULT true,
    goal_milestones BOOLEAN DEFAULT true,
    spending_insights BOOLEAN DEFAULT true,
    daily_tips BOOLEAN DEFAULT false,
    weekly_summary BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Row Level Security for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;

CREATE POLICY "Users can view own preferences" ON notification_preferences FOR
SELECT USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON notification_preferences;

CREATE POLICY "Users can insert own preferences" ON notification_preferences FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;

CREATE POLICY "Users can update own preferences" ON notification_preferences FOR
UPDATE USING (auth.uid () = user_id);

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create notification preferences for new users
DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;

CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job to clean up expired notifications
-- This requires pg_cron extension (comment out if not available)
-- SELECT cron.schedule(
--   'cleanup-expired-notifications',
--   '0 0 * * *', -- Run daily at midnight
--   $$SELECT cleanup_expired_notifications()$$
-- );