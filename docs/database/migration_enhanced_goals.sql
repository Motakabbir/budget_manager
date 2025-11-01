-- ============================================================================
-- ENHANCED FINANCIAL GOALS & MILESTONES - DATABASE MIGRATION
-- ============================================================================
-- This migration enhances the savings_goals table with advanced features:
-- - Multiple goal types (emergency fund, vacation, house, retirement, etc.)
-- - Priority ranking
-- - Milestone tracking
-- - Auto-contribution from income
-- - Required monthly savings calculation
-- Execute this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- ENHANCE savings_goals TABLE
-- Add new columns for advanced goal features
-- ============================================================================

-- Add goal_type column
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'savings_goals' AND column_name = 'goal_type'
    ) THEN
        ALTER TABLE savings_goals 
        ADD COLUMN goal_type TEXT NOT NULL DEFAULT 'general'
        CHECK (goal_type IN (
            'general', 
            'emergency_fund', 
            'vacation', 
            'house_down_payment', 
            'retirement', 
            'debt_free', 
            'car_purchase',
            'education',
            'wedding',
            'investment'
        ));
    END IF;
END $$;

-- Add priority column (1 = highest priority)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'savings_goals' AND column_name = 'priority'
    ) THEN
        ALTER TABLE savings_goals 
        ADD COLUMN priority INTEGER DEFAULT 999 CHECK (priority > 0);
    END IF;
END $$;

-- Add auto_contribute flag
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'savings_goals' AND column_name = 'auto_contribute'
    ) THEN
        ALTER TABLE savings_goals 
        ADD COLUMN auto_contribute BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add auto_contribute_amount
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'savings_goals' AND column_name = 'auto_contribute_amount'
    ) THEN
        ALTER TABLE savings_goals 
        ADD COLUMN auto_contribute_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

-- Add auto_contribute_frequency
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'savings_goals' AND column_name = 'auto_contribute_frequency'
    ) THEN
        ALTER TABLE savings_goals 
        ADD COLUMN auto_contribute_frequency TEXT DEFAULT 'monthly'
        CHECK (auto_contribute_frequency IN ('weekly', 'bi-weekly', 'monthly', 'quarterly'));
    END IF;
END $$;

-- Add last_contribution_date
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'savings_goals' AND column_name = 'last_contribution_date'
    ) THEN
        ALTER TABLE savings_goals 
        ADD COLUMN last_contribution_date DATE;
    END IF;
END $$;

-- Add description
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'savings_goals' AND column_name = 'description'
    ) THEN
        ALTER TABLE savings_goals 
        ADD COLUMN description TEXT;
    END IF;
END $$;

-- Add color for visual customization
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'savings_goals' AND column_name = 'color'
    ) THEN
        ALTER TABLE savings_goals 
        ADD COLUMN color TEXT DEFAULT '#3b82f6';
    END IF;
END $$;

-- Add icon
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'savings_goals' AND column_name = 'icon'
    ) THEN
        ALTER TABLE savings_goals 
        ADD COLUMN icon TEXT;
    END IF;
END $$;

-- Add is_completed flag
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'savings_goals' AND column_name = 'is_completed'
    ) THEN
        ALTER TABLE savings_goals 
        ADD COLUMN is_completed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add completed_at timestamp
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'savings_goals' AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE savings_goals 
        ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================================================
-- CREATE goal_milestones TABLE
-- Track milestones within each goal
-- ============================================================================

CREATE TABLE IF NOT EXISTS goal_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount DECIMAL(10, 2) NOT NULL CHECK (target_amount > 0),
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE goal_contributions TABLE
-- Track individual contributions to goals
-- ============================================================================

CREATE TABLE IF NOT EXISTS goal_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_auto BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_savings_goals_priority ON savings_goals(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_savings_goals_type ON savings_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_savings_goals_auto_contribute ON savings_goals(auto_contribute) WHERE auto_contribute = true;
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_user_id ON goal_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id ON goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_user_id ON goal_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_date ON goal_contributions(contribution_date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - goal_milestones
-- ============================================================================

CREATE POLICY "Users can view own goal milestones" 
ON goal_milestones FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goal milestones" 
ON goal_milestones FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal milestones" 
ON goal_milestones FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal milestones" 
ON goal_milestones FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - goal_contributions
-- ============================================================================

CREATE POLICY "Users can view own goal contributions" 
ON goal_contributions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goal contributions" 
ON goal_contributions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal contributions" 
ON goal_contributions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal contributions" 
ON goal_contributions FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update goal completion status
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if goal is completed
    IF NEW.current_amount >= NEW.target_amount AND NOT NEW.is_completed THEN
        NEW.is_completed := true;
        NEW.completed_at := NOW();
    END IF;
    
    -- Check if goal is uncompleted
    IF NEW.current_amount < NEW.target_amount AND NEW.is_completed THEN
        NEW.is_completed := false;
        NEW.completed_at := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check goal completion on update
DROP TRIGGER IF EXISTS trigger_check_goal_completion ON savings_goals;
CREATE TRIGGER trigger_check_goal_completion
BEFORE UPDATE ON savings_goals
FOR EACH ROW
EXECUTE FUNCTION check_goal_completion();

-- Function to update goal amount when contribution is added
CREATE OR REPLACE FUNCTION update_goal_on_contribution()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE savings_goals
        SET current_amount = current_amount + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.goal_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE savings_goals
        SET current_amount = GREATEST(0, current_amount - OLD.amount),
            updated_at = NOW()
        WHERE id = OLD.goal_id;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE savings_goals
        SET current_amount = current_amount - OLD.amount + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.goal_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update goal amount on contribution changes
DROP TRIGGER IF EXISTS trigger_update_goal_on_contribution ON goal_contributions;
CREATE TRIGGER trigger_update_goal_on_contribution
AFTER INSERT OR UPDATE OR DELETE ON goal_contributions
FOR EACH ROW
EXECUTE FUNCTION update_goal_on_contribution();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE savings_goals IS 'Enhanced savings goals with types, priorities, and auto-contributions';
COMMENT ON TABLE goal_milestones IS 'Milestones within each savings goal';
COMMENT ON TABLE goal_contributions IS 'Individual contributions to savings goals';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Enhanced Financial Goals & Milestones migration completed successfully!';
    RAISE NOTICE '📊 Added: goal types, priorities, auto-contributions, milestones, and contribution tracking';
END $$;
