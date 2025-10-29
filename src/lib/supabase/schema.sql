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
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
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
-- MIGRATION COMPLETE
-- ============================================================================
-- All tables, indexes, policies, and functions have been created.
-- Your Budget Manager database is now ready to use!
-- ============================================================================