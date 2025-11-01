-- ============================================================================
-- SECURITY & PRIVACY MODULE
-- ============================================================================
-- This migration adds security and privacy features including:
-- - User security settings (PIN, biometric, auto-logout, data masking)
-- - Cloud backup configuration
-- - Security audit logs
-- ============================================================================

-- ============================================================================
-- 1. CREATE user_security_settings TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- PIN Protection
    pin_enabled BOOLEAN DEFAULT false,
    pin_hash TEXT, -- Hashed PIN (never store plain text)
    pin_salt TEXT, -- Salt for PIN hashing
    pin_attempts INTEGER DEFAULT 0,
    pin_locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Biometric Authentication
    biometric_enabled BOOLEAN DEFAULT false,
    biometric_type TEXT CHECK (biometric_type IN ('fingerprint', 'face', 'iris', NULL)),
    biometric_credential_id TEXT, -- WebAuthn credential ID
    
    -- Auto-logout Settings
    auto_logout_enabled BOOLEAN DEFAULT true,
    auto_logout_minutes INTEGER DEFAULT 15 CHECK (auto_logout_minutes >= 1 AND auto_logout_minutes <= 1440),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Data Masking
    data_masking_enabled BOOLEAN DEFAULT true,
    mask_account_numbers BOOLEAN DEFAULT true,
    mask_card_numbers BOOLEAN DEFAULT true,
    mask_amounts BOOLEAN DEFAULT false,
    
    -- Session Management
    require_pin_on_launch BOOLEAN DEFAULT false,
    require_biometric_on_launch BOOLEAN DEFAULT false,
    lock_on_minimize BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE security_audit_log TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Event Information
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login_success', 'login_failure', 'logout', 
        'pin_created', 'pin_changed', 'pin_failure', 'pin_locked',
        'biometric_enrolled', 'biometric_removed', 'biometric_failure',
        'auto_logout', 'data_export', 'data_import',
        'settings_changed', 'password_changed'
    )),
    event_description TEXT,
    
    -- Context
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT,
    
    -- Security Details
    success BOOLEAN DEFAULT true,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
    
    -- Metadata
    metadata JSONB,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE cloud_backup_settings TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cloud_backup_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Backup Configuration
    auto_backup_enabled BOOLEAN DEFAULT false,
    backup_frequency TEXT CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'weekly',
    last_backup_at TIMESTAMP WITH TIME ZONE,
    next_backup_at TIMESTAMP WITH TIME ZONE,
    
    -- Encryption
    encryption_enabled BOOLEAN DEFAULT true,
    encryption_key_id TEXT, -- Reference to encrypted key
    
    -- Storage
    storage_path TEXT,
    max_backups INTEGER DEFAULT 5 CHECK (max_backups >= 1 AND max_backups <= 30),
    
    -- Multi-device Sync
    sync_enabled BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================

-- user_security_settings indexes
CREATE INDEX IF NOT EXISTS idx_user_security_settings_user_id 
ON user_security_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_user_security_settings_last_activity 
ON user_security_settings(last_activity_at);

-- security_audit_log indexes
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id 
ON security_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type 
ON security_audit_log(event_type);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at 
ON security_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_risk_level 
ON security_audit_log(risk_level) WHERE risk_level IN ('high', 'critical');

-- cloud_backup_settings indexes
CREATE INDEX IF NOT EXISTS idx_cloud_backup_settings_user_id 
ON cloud_backup_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_cloud_backup_settings_next_backup 
ON cloud_backup_settings(next_backup_at) WHERE auto_backup_enabled = true;

-- ============================================================================
-- 5. CREATE TRIGGERS FOR updated_at
-- ============================================================================

-- Trigger for user_security_settings
CREATE OR REPLACE FUNCTION update_user_security_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_security_settings_updated_at ON user_security_settings;
CREATE TRIGGER trigger_update_user_security_settings_updated_at
    BEFORE UPDATE ON user_security_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_security_settings_updated_at();

-- Trigger for cloud_backup_settings
CREATE OR REPLACE FUNCTION update_cloud_backup_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cloud_backup_settings_updated_at ON cloud_backup_settings;
CREATE TRIGGER trigger_update_cloud_backup_settings_updated_at
    BEFORE UPDATE ON cloud_backup_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_cloud_backup_settings_updated_at();

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_backup_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. CREATE RLS POLICIES - user_security_settings
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own security settings" ON user_security_settings;
CREATE POLICY "Users can view own security settings"
ON user_security_settings FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own security settings" ON user_security_settings;
CREATE POLICY "Users can insert own security settings"
ON user_security_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own security settings" ON user_security_settings;
CREATE POLICY "Users can update own security settings"
ON user_security_settings FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own security settings" ON user_security_settings;
CREATE POLICY "Users can delete own security settings"
ON user_security_settings FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 8. CREATE RLS POLICIES - security_audit_log
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own security logs" ON security_audit_log;
CREATE POLICY "Users can view own security logs"
ON security_audit_log FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own security logs" ON security_audit_log;
CREATE POLICY "Users can insert own security logs"
ON security_audit_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies - audit logs should be immutable

-- ============================================================================
-- 9. CREATE RLS POLICIES - cloud_backup_settings
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own backup settings" ON cloud_backup_settings;
CREATE POLICY "Users can view own backup settings"
ON cloud_backup_settings FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own backup settings" ON cloud_backup_settings;
CREATE POLICY "Users can insert own backup settings"
ON cloud_backup_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own backup settings" ON cloud_backup_settings;
CREATE POLICY "Users can update own backup settings"
ON cloud_backup_settings FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own backup settings" ON cloud_backup_settings;
CREATE POLICY "Users can delete own backup settings"
ON cloud_backup_settings FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 10. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_event_description TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_risk_level TEXT DEFAULT 'low',
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO security_audit_log (
        user_id, event_type, event_description,
        success, risk_level, metadata
    ) VALUES (
        p_user_id, p_event_type, p_event_description,
        p_success, p_risk_level, p_metadata
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last activity
CREATE OR REPLACE FUNCTION update_last_activity(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_security_settings
    SET last_activity_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if session is expired
CREATE OR REPLACE FUNCTION is_session_expired(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_settings RECORD;
    v_expired BOOLEAN;
BEGIN
    SELECT 
        auto_logout_enabled,
        auto_logout_minutes,
        last_activity_at
    INTO v_settings
    FROM user_security_settings
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    IF NOT v_settings.auto_logout_enabled THEN
        RETURN false;
    END IF;
    
    v_expired := (NOW() - v_settings.last_activity_at) > (v_settings.auto_logout_minutes || ' minutes')::INTERVAL;
    
    RETURN v_expired;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check PIN attempts and lock if necessary
CREATE OR REPLACE FUNCTION check_pin_attempts(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_attempts INTEGER;
    v_locked_until TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT pin_attempts, pin_locked_until
    INTO v_attempts, v_locked_until
    FROM user_security_settings
    WHERE user_id = p_user_id;
    
    -- Check if currently locked
    IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
        RETURN false; -- Still locked
    END IF;
    
    -- Reset lock if time has passed
    IF v_locked_until IS NOT NULL AND v_locked_until <= NOW() THEN
        UPDATE user_security_settings
        SET pin_attempts = 0,
            pin_locked_until = NULL
        WHERE user_id = p_user_id;
        RETURN true;
    END IF;
    
    -- Check if max attempts reached (5 attempts)
    IF v_attempts >= 5 THEN
        UPDATE user_security_settings
        SET pin_locked_until = NOW() + INTERVAL '15 minutes'
        WHERE user_id = p_user_id;
        
        -- Log the lock event
        PERFORM log_security_event(
            p_user_id,
            'pin_locked',
            'PIN locked due to too many failed attempts',
            false,
            'high',
            jsonb_build_object('attempts', v_attempts)
        );
        
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. CREATE DEFAULT SETTINGS TRIGGER
-- ============================================================================

-- Automatically create security settings for new users
CREATE OR REPLACE FUNCTION create_default_security_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_security_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO cloud_backup_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_default_security_settings ON auth.users;
CREATE TRIGGER trigger_create_default_security_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_security_settings();

-- ============================================================================
-- 12. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_security_settings IS 'Stores user security preferences including PIN, biometric, and auto-logout settings';
COMMENT ON TABLE security_audit_log IS 'Audit log for security-related events and actions';
COMMENT ON TABLE cloud_backup_settings IS 'Configuration for automated cloud backups and encryption';

COMMENT ON COLUMN user_security_settings.pin_hash IS 'Hashed PIN using bcrypt or argon2 - never store plain text';
COMMENT ON COLUMN user_security_settings.pin_attempts IS 'Number of failed PIN attempts (resets after successful entry)';
COMMENT ON COLUMN user_security_settings.pin_locked_until IS 'Timestamp until which PIN entry is locked due to failed attempts';
COMMENT ON COLUMN user_security_settings.biometric_credential_id IS 'WebAuthn credential ID for biometric authentication';
COMMENT ON COLUMN user_security_settings.auto_logout_minutes IS 'Minutes of inactivity before auto-logout (1-1440)';
COMMENT ON COLUMN user_security_settings.data_masking_enabled IS 'Master switch for all data masking features';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('user_security_settings', 'security_audit_log', 'cloud_backup_settings')
ORDER BY table_name;

-- ============================================================================
-- ROLLBACK COMMANDS (if needed)
-- ============================================================================

/*
-- To rollback this migration, run:

DROP TRIGGER IF EXISTS trigger_create_default_security_settings ON auth.users;
DROP FUNCTION IF EXISTS create_default_security_settings();
DROP FUNCTION IF EXISTS check_pin_attempts(UUID);
DROP FUNCTION IF EXISTS is_session_expired(UUID);
DROP FUNCTION IF EXISTS update_last_activity(UUID);
DROP FUNCTION IF EXISTS log_security_event(UUID, TEXT, TEXT, BOOLEAN, TEXT, JSONB);

DROP TABLE IF EXISTS cloud_backup_settings CASCADE;
DROP TABLE IF EXISTS security_audit_log CASCADE;
DROP TABLE IF EXISTS user_security_settings CASCADE;

DROP FUNCTION IF EXISTS update_cloud_backup_settings_updated_at();
DROP FUNCTION IF EXISTS update_user_security_settings_updated_at();
*/
