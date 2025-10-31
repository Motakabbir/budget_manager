-- Enhanced Notifications Migration
-- Adds support for advanced notification features including SMS, email, push notifications,
-- scheduled notifications, and AI-powered alerts

-- Add new columns to notification_preferences table
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS low_balance_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS unusual_spending_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS bill_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS credit_card_due BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS loan_emi_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS subscription_renewals BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS notification_schedule JSONB DEFAULT '{"morning": "09:00", "evening": "18:00"}',
ADD COLUMN IF NOT EXISTS quiet_hours_start TIME DEFAULT '22:00',
ADD COLUMN IF NOT EXISTS quiet_hours_end TIME DEFAULT '08:00';

-- Add new columns to notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS channel VARCHAR(20) DEFAULT 'in-app' CHECK (channel IN ('in-app', 'email', 'sms', 'push')),
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255); -- For SMS/email provider IDs

-- Create notification_templates table for reusable templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_type VARCHAR(50) NOT NULL UNIQUE,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    channels TEXT[] DEFAULT ARRAY['in-app'], -- Array of supported channels
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_schedules table for recurring notifications
CREATE TABLE IF NOT EXISTS notification_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_type VARCHAR(50) NOT NULL REFERENCES notification_templates(template_type),
    schedule_config JSONB NOT NULL, -- Cron expression or schedule details
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unusual_spending_patterns table for AI-powered detection
CREATE TABLE IF NOT EXISTS unusual_spending_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    average_amount DECIMAL(10,2),
    standard_deviation DECIMAL(10,2),
    transaction_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id)
);

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_delivery_status ON notifications(delivery_status);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_user_active ON notification_schedules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_next_run ON notification_schedules(next_run);
CREATE INDEX IF NOT EXISTS idx_unusual_spending_patterns_user ON unusual_spending_patterns(user_id);

-- Update RLS policies for new tables
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE unusual_spending_patterns ENABLE ROW LEVEL SECURITY;

-- Templates are readable by all authenticated users
CREATE POLICY "Templates are readable by all users" ON notification_templates FOR SELECT USING (auth.role() = 'authenticated');

-- Schedules are user-specific
CREATE POLICY "Users can view own schedules" ON notification_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedules" ON notification_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedules" ON notification_schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedules" ON notification_schedules FOR DELETE USING (auth.uid() = user_id);

-- Unusual spending patterns are user-specific
CREATE POLICY "Users can view own spending patterns" ON unusual_spending_patterns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own spending patterns" ON unusual_spending_patterns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own spending patterns" ON unusual_spending_patterns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own spending patterns" ON unusual_spending_patterns FOR DELETE USING (auth.uid() = user_id);

-- Function to update notification preferences with new defaults
CREATE OR REPLACE FUNCTION update_notification_preferences_defaults()
RETURNS void AS $$
BEGIN
  UPDATE notification_preferences
  SET
    low_balance_alerts = COALESCE(low_balance_alerts, true),
    unusual_spending_alerts = COALESCE(unusual_spending_alerts, true),
    bill_reminders = COALESCE(bill_reminders, true),
    credit_card_due = COALESCE(credit_card_due, true),
    loan_emi_reminders = COALESCE(loan_emi_reminders, true),
    subscription_renewals = COALESCE(subscription_renewals, true),
    sms_notifications = COALESCE(sms_notifications, false),
    notification_schedule = COALESCE(notification_schedule, '{"morning": "09:00", "evening": "18:00"}'),
    quiet_hours_start = COALESCE(quiet_hours_start, '22:00'::time),
    quiet_hours_end = COALESCE(quiet_hours_end, '08:00'::time)
  WHERE low_balance_alerts IS NULL OR unusual_spending_alerts IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the update function
SELECT update_notification_preferences_defaults();

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

    IF pattern_record.transaction_count >= 5 THEN -- Need minimum transactions for pattern analysis
        -- Calculate threshold as average + 2 standard deviations
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

        -- Calculate new standard deviation (simplified)
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

-- Function to create scheduled notifications
CREATE OR REPLACE FUNCTION create_scheduled_notifications()
RETURNS void AS $$
DECLARE
    schedule_record RECORD;
    template_record RECORD;
    next_run_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Process all active schedules
    FOR schedule_record IN
        SELECT * FROM notification_schedules
        WHERE is_active = true AND next_run <= NOW()
    LOOP
        -- Get template
        SELECT * INTO template_record
        FROM notification_templates
        WHERE template_type = schedule_record.template_type AND is_active = true;

        IF FOUND THEN
            -- Create notification
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                priority,
                scheduled_for,
                metadata
            ) VALUES (
                schedule_record.user_id,
                template_record.template_type,
                template_record.title_template,
                template_record.message_template,
                template_record.priority,
                schedule_record.next_run,
                schedule_record.schedule_config
            );

            -- Update schedule's last_run and calculate next_run
            UPDATE notification_schedules
            SET
                last_run = schedule_record.next_run,
                next_run = schedule_record.next_run + INTERVAL '1 day', -- Simplified: daily recurrence
                updated_at = NOW()
            WHERE id = schedule_record.id;
        END IF;
    END LOOP;
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
        -- Reschedule for morning
        UPDATE notifications
        SET scheduled_for = CURRENT_DATE + user_prefs.notification_schedule->>'morning'::time
        WHERE id = p_notification_id;
        RETURN true; -- Consider it successful as it's rescheduled
    END IF;

    -- Here you would integrate with actual email/SMS services
    -- For now, just mark as sent
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