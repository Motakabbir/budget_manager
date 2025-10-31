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
-- MIGRATION COMPLETE
-- ============================================================================
-- All tables, indexes, policies, and functions have been created.
-- Your Budget Manager database is now ready to use!
-- ============================================================================