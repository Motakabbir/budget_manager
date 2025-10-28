-- Add category_budgets table for Budget vs Actual feature
-- Run this in Supabase SQL Editor

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

CREATE INDEX IF NOT EXISTS idx_category_budgets_user_id ON category_budgets (user_id);

CREATE INDEX IF NOT EXISTS idx_category_budgets_category_id ON category_budgets (category_id);

ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets" ON category_budgets FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can create own budgets" ON category_budgets FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update own budgets" ON category_budgets FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete own budgets" ON category_budgets FOR DELETE USING (auth.uid () = user_id);