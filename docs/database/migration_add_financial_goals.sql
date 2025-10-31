-- ============================================================================
-- FINANCIAL GOALS & MILESTONES MODULE - DATABASE MIGRATION
-- ============================================================================
-- This migration enhances the savings goals functionality with advanced
-- goal types, milestones, priority ranking, and auto-contribution features
-- Execute this in Supabase SQL Editor after running the main schema.sql
-- ============================================================================

-- ============================================================================
-- ENHANCE EXISTING savings_goals TABLE
-- ============================================================================

-- Add new columns to existing savings_goals table
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS goal_type TEXT CHECK (goal_type IN (
    'emergency_fund',
    'vacation_fund',
    'house_down_payment',
    'retirement_planning',
    'debt_free_goal',
    'car_purchase',
    'custom'
)) DEFAULT 'custom';

ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS priority INTEGER CHECK (priority >= 1 AND priority <= 10) DEFAULT 5;

ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS auto_contribution_enabled BOOLEAN DEFAULT false;

ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS auto_contribution_amount DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS auto_contribution_frequency TEXT CHECK (auto_contribution_frequency IN (
    'weekly',
    'bi-weekly',
    'monthly',
    'quarterly'
)) DEFAULT 'monthly';

ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS target_date DATE;

-- ============================================================================
-- NEW TABLE: goal_milestones
-- Tracks progress milestones for each savings goal
-- ============================================================================

CREATE TABLE IF NOT EXISTS goal_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    milestone_name TEXT NOT NULL,
    milestone_percentage DECIMAL(5, 2) NOT NULL CHECK (milestone_percentage > 0 AND milestone_percentage <= 100),
    target_amount DECIMAL(10, 2) NOT NULL,
    is_achieved BOOLEAN DEFAULT false,
    achieved_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(goal_id, milestone_percentage)
);

-- ============================================================================
-- NEW TABLE: goal_contributions
-- Tracks individual contributions to savings goals
-- ============================================================================

CREATE TABLE IF NOT EXISTS goal_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source TEXT, -- 'manual', 'auto', 'income_percentage'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Goal milestones indexes
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_achieved ON goal_milestones(is_achieved);

-- Goal contributions indexes
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id ON goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_date ON goal_contributions(contribution_date);

-- Enhanced savings goals indexes
CREATE INDEX IF NOT EXISTS idx_savings_goals_goal_type ON savings_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_savings_goals_priority ON savings_goals(priority);
CREATE INDEX IF NOT EXISTS idx_savings_goals_auto_contribution ON savings_goals(auto_contribution_enabled);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

-- Goal milestones policies
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

-- Goal contributions policies
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
-- FUNCTIONS AND TRIGGERS
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

-- Function to calculate goal analytics
CREATE OR REPLACE FUNCTION get_goal_analytics(goal_uuid UUID)
RETURNS TABLE (
    remaining_amount DECIMAL(10, 2),
    months_to_goal DECIMAL(10, 2),
    monthly_savings_needed DECIMAL(10, 2),
    progress_percentage DECIMAL(5, 2),
    days_remaining INTEGER
) AS $$
DECLARE
    goal_record RECORD;
    days_diff INTEGER;
BEGIN
    -- Get goal details
    SELECT * INTO goal_record FROM savings_goals WHERE id = goal_uuid;

    -- Calculate remaining amount
    remaining_amount := goal_record.target_amount - goal_record.current_amount;

    -- Calculate progress percentage
    progress_percentage := CASE
        WHEN goal_record.target_amount > 0 THEN (goal_record.current_amount / goal_record.target_amount) * 100
        ELSE 0
    END;

    -- Calculate days remaining
    days_diff := CASE
        WHEN goal_record.target_date IS NOT NULL THEN goal_record.target_date - CURRENT_DATE
        WHEN goal_record.deadline IS NOT NULL THEN goal_record.deadline - CURRENT_DATE
        ELSE NULL
    END;

    days_remaining := GREATEST(days_diff, 0);

    -- Calculate months to goal
    months_to_goal := CASE
        WHEN days_diff > 0 THEN days_diff / 30.0
        ELSE NULL
    END;

    -- Calculate monthly savings needed
    monthly_savings_needed := CASE
        WHEN months_to_goal > 0 THEN remaining_amount / months_to_goal
        ELSE NULL
    END;

    RETURN QUERY SELECT
        remaining_amount,
        months_to_goal,
        monthly_savings_needed,
        progress_percentage,
        days_remaining;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA INSERTION (Optional)
-- ============================================================================

-- Insert sample goal types data (this would be handled by the application)
-- The goal_type column uses predefined values, so no separate table needed

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Note: After running this migration, update your application code to:
-- 1. Use the new goal_type field for predefined goal categories
-- 2. Implement milestone tracking UI
-- 3. Add auto-contribution functionality
-- 4. Create analytics dashboard for goal progress</content>
<parameter name="filePath">/media/dolar/office/projects/budget_manager/docs/database/migration_add_financial_goals.sql