-- ============================================================================
-- BUDGET MANAGER - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This file contains all tables, indexes, policies, and functions needed
-- for the Budget Manager application. Execute this entire file in Supabase
-- SQL Editor to set up the complete database schema.
-- ============================================================================

-- ============================================================================
-- TABLE DEFINITIONS
-- ============================================================================

-- Categories table: Stores income and expense categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT NOT NULL DEFAULT '#3b82f6',
    icon TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        UNIQUE (user_id, name, type)
);

-- Transactions table: Stores all income and expense transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Savings goals table: Tracks user savings goals
CREATE TABLE IF NOT EXISTS savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(10, 2) NOT NULL,
    current_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    deadline DATE,
    goal_type TEXT CHECK (goal_type IN ('emergency_fund', 'vacation_fund', 'house_down_payment', 'retirement_planning', 'debt_free_goal', 'car_purchase', 'custom')) DEFAULT 'custom',
    priority INTEGER CHECK (priority >= 1 AND priority <= 10) DEFAULT 5,
    auto_contribution_enabled BOOLEAN DEFAULT false,
    auto_contribution_amount DECIMAL(10, 2) DEFAULT 0,
    auto_contribution_frequency TEXT CHECK (auto_contribution_frequency IN ('weekly', 'bi-weekly', 'monthly', 'quarterly')) DEFAULT 'monthly',
    description TEXT,
    target_date DATE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Goal milestones table: Tracks progress milestones for savings goals
CREATE TABLE IF NOT EXISTS goal_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    goal_id UUID NOT NULL REFERENCES savings_goals (id) ON DELETE CASCADE,
    milestone_name TEXT NOT NULL,
    milestone_percentage DECIMAL(5, 2) NOT NULL CHECK (milestone_percentage > 0 AND milestone_percentage <= 100),
    target_amount DECIMAL(10, 2) NOT NULL,
    is_achieved BOOLEAN DEFAULT false,
    achieved_date DATE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        UNIQUE (goal_id, milestone_percentage)
);

-- Goal contributions table: Tracks individual contributions to savings goals
CREATE TABLE IF NOT EXISTS goal_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    goal_id UUID NOT NULL REFERENCES savings_goals (id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source TEXT CHECK (source IN ('manual', 'auto', 'income_percentage')),
    notes TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- User settings table: Stores user preferences and opening balance
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE UNIQUE,
    opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
    opening_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Category budgets table: Stores budget limits per category
CREATE TABLE IF NOT EXISTS category_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    period TEXT NOT NULL CHECK (
        period IN ('monthly', 'yearly')
    ) DEFAULT 'monthly',
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        UNIQUE (user_id, category_id, period)
);

-- Recurring transactions table: Stores templates for recurring transactions
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    frequency TEXT NOT NULL CHECK (
        frequency IN (
            'daily',
            'weekly',
            'bi-weekly',
            'monthly',
            'quarterly',
            'yearly'
        )
    ),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    next_occurrence DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories (user_id);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);

CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions (category_id);

-- Savings goals indexes
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals (user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_goal_type ON savings_goals (goal_type);
CREATE INDEX IF NOT EXISTS idx_savings_goals_priority ON savings_goals (priority);
CREATE INDEX IF NOT EXISTS idx_savings_goals_auto_contribution ON savings_goals (auto_contribution_enabled);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON goal_milestones (goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_achieved ON goal_milestones (is_achieved);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id ON goal_contributions (goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_date ON goal_contributions (contribution_date);

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings (user_id);

-- Category budgets indexes
CREATE INDEX IF NOT EXISTS idx_category_budgets_user_id ON category_budgets (user_id);

CREATE INDEX IF NOT EXISTS idx_category_budgets_category_id ON category_budgets (category_id);

-- Recurring transactions indexes
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_occurrence ON recurring_transactions (next_occurrence);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_active ON recurring_transactions (is_active)
WHERE
    is_active = true;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) ENABLEMENT
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - CATEGORIES
-- ============================================================================

CREATE POLICY "Users can view own categories" ON categories FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can create own categories" ON categories FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update own categories" ON categories FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid () = user_id);

-- ============================================================================
-- RLS POLICIES - TRANSACTIONS
-- ============================================================================

CREATE POLICY "Users can view own transactions" ON transactions FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can create own transactions" ON transactions FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update own transactions" ON transactions FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid () = user_id);

-- ============================================================================
-- RLS POLICIES - SAVINGS GOALS
-- ============================================================================

CREATE POLICY "Users can view own savings goals" ON savings_goals FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can create own savings goals" ON savings_goals FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update own savings goals" ON savings_goals FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete own savings goals" ON savings_goals FOR DELETE USING (auth.uid () = user_id);

-- ============================================================================
-- RLS POLICIES - GOAL MILESTONES
-- ============================================================================

CREATE POLICY "Users can view own goal milestones" ON goal_milestones FOR
SELECT USING (
    EXISTS (
        SELECT 1 FROM savings_goals
        WHERE savings_goals.id = goal_milestones.goal_id
        AND savings_goals.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create own goal milestones" ON goal_milestones FOR
INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM savings_goals
        WHERE savings_goals.id = goal_milestones.goal_id
        AND savings_goals.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update own goal milestones" ON goal_milestones FOR
UPDATE USING (
    EXISTS (
        SELECT 1 FROM savings_goals
        WHERE savings_goals.id = goal_milestones.goal_id
        AND savings_goals.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete own goal milestones" ON goal_milestones FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM savings_goals
        WHERE savings_goals.id = goal_milestones.goal_id
        AND savings_goals.user_id = auth.uid()
    )
);

-- ============================================================================
-- RLS POLICIES - GOAL CONTRIBUTIONS
-- ============================================================================

CREATE POLICY "Users can view own goal contributions" ON goal_contributions FOR
SELECT USING (
    EXISTS (
        SELECT 1 FROM savings_goals
        WHERE savings_goals.id = goal_contributions.goal_id
        AND savings_goals.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create own goal contributions" ON goal_contributions FOR
INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM savings_goals
        WHERE savings_goals.id = goal_contributions.goal_id
        AND savings_goals.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update own goal contributions" ON goal_contributions FOR
UPDATE USING (
    EXISTS (
        SELECT 1 FROM savings_goals
        WHERE savings_goals.id = goal_contributions.goal_id
        AND savings_goals.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete own goal contributions" ON goal_contributions FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM savings_goals
        WHERE savings_goals.id = goal_contributions.goal_id
        AND savings_goals.user_id = auth.uid()
    )
);

-- ============================================================================
-- RLS POLICIES - USER SETTINGS
-- ============================================================================

CREATE POLICY "Users can view own settings" ON user_settings FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can create own settings" ON user_settings FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update own settings" ON user_settings FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings FOR DELETE USING (auth.uid () = user_id);

-- ============================================================================
-- RLS POLICIES - CATEGORY BUDGETS
-- ============================================================================

CREATE POLICY "Users can view own budgets" ON category_budgets FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can create own budgets" ON category_budgets FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update own budgets" ON category_budgets FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete own budgets" ON category_budgets FOR DELETE USING (auth.uid () = user_id);

-- ============================================================================
-- RLS POLICIES - RECURRING TRANSACTIONS
-- ============================================================================

CREATE POLICY "Users can view own recurring transactions" ON recurring_transactions FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can create own recurring transactions" ON recurring_transactions FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update own recurring transactions" ON recurring_transactions FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete own recurring transactions" ON recurring_transactions FOR DELETE USING (auth.uid () = user_id);

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Function: Create transaction from recurring template
-- This function creates a new transaction from a recurring template and
-- automatically updates the next occurrence date based on the frequency
CREATE OR REPLACE FUNCTION create_recurring_transaction(recurring_id UUID)
RETURNS UUID AS $$
DECLARE
    recurring_record recurring_transactions%ROWTYPE;
    new_transaction_id UUID;
    next_date DATE;
BEGIN
    -- Get the recurring transaction
    SELECT * INTO recurring_record 
    FROM recurring_transactions 
    WHERE id = recurring_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recurring transaction not found or inactive';
    END IF;
    
    -- Create the actual transaction
    INSERT INTO transactions (user_id, category_id, amount, description, date, type)
    VALUES (
        recurring_record.user_id,
        recurring_record.category_id,
        recurring_record.amount,
        recurring_record.description,
        recurring_record.next_occurrence,
        recurring_record.type
    )
    RETURNING id INTO new_transaction_id;
    
    -- Calculate next occurrence based on frequency
    CASE recurring_record.frequency
        WHEN 'daily' THEN
            next_date := recurring_record.next_occurrence + INTERVAL '1 day';
        WHEN 'weekly' THEN
            next_date := recurring_record.next_occurrence + INTERVAL '1 week';
        WHEN 'bi-weekly' THEN
            next_date := recurring_record.next_occurrence + INTERVAL '2 weeks';
        WHEN 'monthly' THEN
            next_date := recurring_record.next_occurrence + INTERVAL '1 month';
        WHEN 'quarterly' THEN
            next_date := recurring_record.next_occurrence + INTERVAL '3 months';
        WHEN 'yearly' THEN
            next_date := recurring_record.next_occurrence + INTERVAL '1 year';
        ELSE
            next_date := recurring_record.next_occurrence + INTERVAL '1 month';
    END CASE;
    
    -- Update next occurrence (or deactivate if past end date)
    IF recurring_record.end_date IS NULL OR next_date <= recurring_record.end_date THEN
        UPDATE recurring_transactions
        SET next_occurrence = next_date, updated_at = NOW()
        WHERE id = recurring_id;
    ELSE
        UPDATE recurring_transactions
        SET is_active = false, updated_at = NOW()
        WHERE id = recurring_id;
    END IF;
    
    RETURN new_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON
TABLE categories IS 'Stores user-defined income and expense categories';

COMMENT ON
TABLE transactions IS 'Stores all income and expense transactions';

COMMENT ON
TABLE savings_goals IS 'Tracks user savings goals with targets and deadlines';

COMMENT ON
TABLE user_settings IS 'Stores user preferences and opening balance information';

COMMENT ON
TABLE category_budgets IS 'Stores budget limits for each category (monthly/yearly)';

COMMENT ON
TABLE recurring_transactions IS 'Stores templates for recurring income and expense transactions';

COMMENT ON FUNCTION create_recurring_transaction (UUID) IS 'Creates a new transaction from a recurring template and updates the next occurrence date';

-- ============================================================================
-- GOAL MILESTONES FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically create default milestones for a goal
CREATE OR REPLACE FUNCTION create_default_milestones(goal_uuid UUID)
RETURNS VOID AS $$
DECLARE
    goal_record RECORD;
BEGIN
    -- Get goal details
    SELECT * INTO goal_record FROM savings_goals WHERE id = goal_uuid;

    -- Create default milestones at 25%, 50%, 75%, 100%
    INSERT INTO goal_milestones (goal_id, milestone_name, milestone_percentage, target_amount)
    VALUES
        (goal_uuid, '25% Complete', 25.00, goal_record.target_amount * 0.25),
        (goal_uuid, '50% Complete', 50.00, goal_record.target_amount * 0.50),
        (goal_uuid, '75% Complete', 75.00, goal_record.target_amount * 0.75),
        (goal_uuid, 'Goal Achieved!', 100.00, goal_record.target_amount);
END;
$$ LANGUAGE plpgsql;

-- Function to update milestone achievements
CREATE OR REPLACE FUNCTION update_milestone_achievements()
RETURNS TRIGGER AS $$
BEGIN
    -- Update milestones when goal current_amount changes
    UPDATE goal_milestones
    SET
        is_achieved = CASE
            WHEN (NEW.current_amount >= target_amount) THEN true
            ELSE false
        END,
        achieved_date = CASE
            WHEN (NEW.current_amount >= target_amount AND (OLD.current_amount < target_amount OR achieved_date IS NULL)) THEN CURRENT_DATE
            ELSE achieved_date
        END,
        updated_at = NOW()
    WHERE goal_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for milestone updates
DROP TRIGGER IF EXISTS trigger_update_milestones ON savings_goals;
CREATE TRIGGER trigger_update_milestones
    AFTER UPDATE OF current_amount ON savings_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_milestone_achievements();

-- ============================================================================
-- NOTIFICATIONS SYSTEM
-- ============================================================================

-- Notifications table: Stores all user notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
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
    channel VARCHAR(20) DEFAULT 'in-app' CHECK (channel IN ('in-app', 'email', 'sms', 'push')),
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(255),
    metadata JSONB,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
    retry_count INTEGER DEFAULT 0,
    external_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Notification preferences table: Stores user notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
    budget_alerts BOOLEAN DEFAULT true,
    goal_milestones BOOLEAN DEFAULT true,
    spending_insights BOOLEAN DEFAULT true,
    daily_tips BOOLEAN DEFAULT false,
    weekly_summary BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT false,
    sms_notifications BOOLEAN DEFAULT false,
    sms_phone_number VARCHAR(20),
    low_balance_alerts BOOLEAN DEFAULT true,
    unusual_spending_alerts BOOLEAN DEFAULT true,
    bill_reminders BOOLEAN DEFAULT true,
    credit_card_due BOOLEAN DEFAULT true,
    loan_emi_reminders BOOLEAN DEFAULT true,
    subscription_renewals BOOLEAN DEFAULT true,
    notification_schedule JSONB DEFAULT '{"morning": "09:00", "evening": "18:00"}',
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification templates table: Stores reusable notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_type VARCHAR(50) NOT NULL UNIQUE,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    channels TEXT[] DEFAULT ARRAY['in-app'],
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification schedules table: Stores recurring notification schedules
CREATE TABLE IF NOT EXISTS notification_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_type VARCHAR(50) NOT NULL REFERENCES notification_templates(template_type),
    schedule_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unusual spending patterns table: Stores spending patterns for AI detection
CREATE TABLE IF NOT EXISTS unusual_spending_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    average_amount DECIMAL(10,2),
    standard_deviation DECIMAL(10,2),
    transaction_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id)
);

-- ============================================================================
-- NOTIFICATIONS INDEXES
-- ============================================================================

-- Indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_delivery_status ON notifications(delivery_status);

-- Indexes for notification schedules
CREATE INDEX IF NOT EXISTS idx_notification_schedules_user_active ON notification_schedules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_next_run ON notification_schedules(next_run);

-- Indexes for unusual spending patterns
CREATE INDEX IF NOT EXISTS idx_unusual_spending_patterns_user ON unusual_spending_patterns(user_id);

-- ============================================================================
-- NOTIFICATIONS ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS for all notification tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE unusual_spending_patterns ENABLE ROW LEVEL SECURITY;

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR
SELECT USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
CREATE POLICY "Users can insert own notifications" ON notifications FOR
INSERT WITH CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR
UPDATE USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid () = user_id);

-- Notification preferences policies
DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences" ON notification_preferences FOR
SELECT USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON notification_preferences;
CREATE POLICY "Users can insert own preferences" ON notification_preferences FOR
INSERT WITH CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;
CREATE POLICY "Users can update own preferences" ON notification_preferences FOR
UPDATE USING (auth.uid () = user_id);

-- Notification templates policies (readable by all authenticated users)
CREATE POLICY "Templates are readable by all users" ON notification_templates FOR SELECT USING (auth.role() = 'authenticated');

-- Notification schedules policies
CREATE POLICY "Users can view own schedules" ON notification_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedules" ON notification_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedules" ON notification_schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedules" ON notification_schedules FOR DELETE USING (auth.uid() = user_id);

-- Unusual spending patterns policies
CREATE POLICY "Users can view own spending patterns" ON unusual_spending_patterns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own spending patterns" ON unusual_spending_patterns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own spending patterns" ON unusual_spending_patterns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own spending patterns" ON unusual_spending_patterns FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- NOTIFICATIONS FUNCTIONS
-- ============================================================================

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

-- Function to detect unusual spending
CREATE OR REPLACE FUNCTION detect_unusual_spending(
    p_user_id UUID,
    p_category_id UUID,
    p_amount DECIMAL,
    p_transaction_date DATE DEFAULT CURRENT_DATE
) RETURNS BOOLEAN AS $$
DECLARE
    pattern_record RECORD;
    threshold DECIMAL;
    is_unusual BOOLEAN := false;
BEGIN
    -- Get spending pattern for this user and category
    SELECT * INTO pattern_record
    FROM unusual_spending_patterns
    WHERE user_id = p_user_id AND category_id = p_category_id;

    IF pattern_record.transaction_count >= 5 THEN
        threshold := pattern_record.average_amount + (2 * pattern_record.standard_deviation);

        IF p_amount > threshold THEN
            is_unusual := true;
        END IF;
    END IF;

    RETURN is_unusual;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update spending patterns after transaction
CREATE OR REPLACE FUNCTION update_spending_patterns(
    p_user_id UUID,
    p_category_id UUID,
    p_amount DECIMAL
) RETURNS void AS $$
DECLARE
    current_stats RECORD;
    new_count INTEGER;
    new_avg DECIMAL;
    new_stddev DECIMAL;
BEGIN
    -- Get current statistics
    SELECT transaction_count, average_amount, standard_deviation
    INTO current_stats
    FROM unusual_spending_patterns
    WHERE user_id = p_user_id AND category_id = p_category_id;

    IF FOUND THEN
        -- Update existing pattern
        new_count := current_stats.transaction_count + 1;
        new_avg := ((current_stats.average_amount * current_stats.transaction_count) + p_amount) / new_count;
        new_stddev := GREATEST(current_stats.standard_deviation * 0.9 + ABS(p_amount - new_avg) * 0.1, 1.00);

        UPDATE unusual_spending_patterns
        SET
            average_amount = new_avg,
            standard_deviation = new_stddev,
            transaction_count = new_count,
            last_updated = NOW()
        WHERE user_id = p_user_id AND category_id = p_category_id;
    ELSE
        -- Insert new pattern
        INSERT INTO unusual_spending_patterns (user_id, category_id, average_amount, standard_deviation, transaction_count)
        VALUES (p_user_id, p_category_id, p_amount, 0, 1);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notifications via different channels
CREATE OR REPLACE FUNCTION send_notification(
    p_notification_id UUID,
    p_channel VARCHAR DEFAULT 'in-app'
) RETURNS BOOLEAN AS $$
DECLARE
    notification_record RECORD;
    user_prefs RECORD;
    success BOOLEAN := false;
BEGIN
    -- Get notification details
    SELECT * INTO notification_record
    FROM notifications
    WHERE id = p_notification_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Get user preferences
    SELECT * INTO user_prefs
    FROM notification_preferences
    WHERE user_id = notification_record.user_id;

    -- Check if user wants this type of notification via this channel
    CASE p_channel
        WHEN 'email' THEN
            IF NOT user_prefs.email_notifications THEN
                RETURN false;
            END IF;
        WHEN 'sms' THEN
            IF NOT user_prefs.sms_notifications OR user_prefs.sms_phone_number IS NULL THEN
                RETURN false;
            END IF;
        WHEN 'push' THEN
            IF NOT user_prefs.push_notifications THEN
                RETURN false;
            END IF;
    END CASE;

    -- Check quiet hours
    IF CURRENT_TIME BETWEEN user_prefs.quiet_hours_start AND user_prefs.quiet_hours_end THEN
        UPDATE notifications
        SET scheduled_for = CURRENT_DATE + user_prefs.notification_schedule->>'morning'::time
        WHERE id = p_notification_id;
        RETURN true;
    END IF;

    -- Mark as sent (integrate with actual services later)
    UPDATE notifications
    SET
        channel = p_channel,
        sent_at = NOW(),
        delivery_status = 'sent'
    WHERE id = p_notification_id;

    success := true;
    RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NOTIFICATIONS DATA
-- ============================================================================

-- Insert default notification templates
INSERT INTO notification_templates (template_type, title_template, message_template, channels, priority) VALUES
('low_balance_warning', 'Low Balance Alert', 'Your {{account_name}} account balance is ${{current_balance}}. Consider transferring funds to avoid overdraft fees.', ARRAY['in-app', 'email', 'sms'], 'high'),
('unusual_spending_detected', 'Unusual Spending Detected', 'We detected unusual spending of ${{amount}} in {{category}} category. This is {{percentage}}% higher than your average.', ARRAY['in-app', 'email', 'push'], 'high'),
('bill_reminder_3_days', 'Bill Due Soon', 'Your {{bill_name}} bill of ${{amount}} is due in 3 days on {{due_date}}.', ARRAY['in-app', 'email'], 'normal'),
('bill_reminder_1_day', 'Bill Due Tomorrow', 'Your {{bill_name}} bill of ${{amount}} is due tomorrow.', ARRAY['in-app', 'email', 'sms'], 'high'),
('bill_reminder_today', 'Bill Due Today', 'Your {{bill_name}} bill of ${{amount}} is due today. Please make payment to avoid late fees.', ARRAY['in-app', 'email', 'sms'], 'urgent'),
('credit_card_payment_due', 'Credit Card Payment Due', 'Your {{card_name}} payment of ${{amount}} is due on {{due_date}}.', ARRAY['in-app', 'email', 'sms'], 'high'),
('loan_emi_reminder', 'Loan EMI Due', 'Your {{loan_name}} EMI of ${{amount}} is due on {{due_date}}.', ARRAY['in-app', 'email', 'sms'], 'high'),
('budget_exceeded', 'Budget Exceeded', 'You have exceeded your {{category}} budget by ${{over_amount}}. Current spending: ${{spent}}/{{budget}}.', ARRAY['in-app', 'email', 'push'], 'high'),
('goal_milestone', 'Goal Milestone Achieved', 'Congratulations! You''ve reached {{percentage}}% of your {{goal_name}} goal.', ARRAY['in-app', 'email'], 'normal'),
('subscription_renewal', 'Subscription Renewal Reminder', 'Your {{service_name}} subscription will renew on {{renewal_date}} for ${{amount}}.', ARRAY['in-app', 'email'], 'normal'),
('weekly_summary', 'Weekly Financial Summary', 'This week: Income ${{income}}, Expenses ${{expenses}}, Net ${{net}}. You''re {{savings_rate}}% towards your savings goal.', ARRAY['in-app', 'email'], 'low'),
('monthly_report', 'Monthly Financial Report', 'Monthly summary: Total income ${{income}}, expenses ${{expenses}}, savings ${{savings}}.', ARRAY['in-app', 'email'], 'normal')
ON CONFLICT (template_type) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All tables, indexes, policies, and functions have been created.
-- Your Budget Manager database is now ready to use!
-- ============================================================================