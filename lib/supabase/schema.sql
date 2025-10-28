-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
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

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
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

-- Create savings_goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories (user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);

CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions (category_id);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals (user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR
SELECT USING (auth.uid () = id);

CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid () = id);

-- Categories policies
CREATE POLICY "Users can view own categories" ON categories FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can create own categories" ON categories FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update own categories" ON categories FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid () = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can create own transactions" ON transactions FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update own transactions" ON transactions FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid () = user_id);

-- Savings goals policies
CREATE POLICY "Users can view own savings goals" ON savings_goals FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can create own savings goals" ON savings_goals FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update own savings goals" ON savings_goals FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete own savings goals" ON savings_goals FOR DELETE USING (auth.uid () = user_id);