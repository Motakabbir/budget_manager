-- ============================================================================
-- BANK ACCOUNTS MODULE - DATABASE MIGRATION
-- ============================================================================
-- This migration adds bank accounts and inter-account transfer functionality
-- Execute this in Supabase SQL Editor after running the main schema.sql
-- ============================================================================

-- ============================================================================
-- TABLE: bank_accounts
-- Stores user's bank accounts (checking, savings, investment, cash, wallet)
-- ============================================================================

CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    bank_name TEXT,
    account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment', 'cash', 'wallet', 'other')),
    account_number TEXT, -- masked for security (e.g., "****1234")
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    color TEXT NOT NULL DEFAULT '#3b82f6',
    icon TEXT, -- lucide icon name
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE: account_transfers
-- Tracks money transfers between user's accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS account_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    to_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    transfer_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT different_accounts CHECK (from_account_id != to_account_id)
);

-- ============================================================================
-- MODIFY EXISTING TABLES
-- Add account_id column to transactions table
-- ============================================================================

-- Add account_id to transactions if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'account_id'
    ) THEN
        ALTER TABLE transactions ADD COLUMN account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_active ON bank_accounts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_account_transfers_user_id ON account_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_account_transfers_from_account ON account_transfers(from_account_id);
CREATE INDEX IF NOT EXISTS idx_account_transfers_to_account ON account_transfers(to_account_id);
CREATE INDEX IF NOT EXISTS idx_account_transfers_date ON account_transfers(date);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_transfers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - bank_accounts
-- ============================================================================

CREATE POLICY "Users can view own bank accounts" 
ON bank_accounts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bank accounts" 
ON bank_accounts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts" 
ON bank_accounts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank accounts" 
ON bank_accounts FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - account_transfers
-- ============================================================================

CREATE POLICY "Users can view own account transfers" 
ON account_transfers FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own account transfers" 
ON account_transfers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own account transfers" 
ON account_transfers FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own account transfers" 
ON account_transfers FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to bank_accounts
DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to account_transfers
DROP TRIGGER IF EXISTS update_account_transfers_updated_at ON account_transfers;
CREATE TRIGGER update_account_transfers_updated_at
    BEFORE UPDATE ON account_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Transfer money between accounts
-- Automatically updates both account balances and creates transfer record
-- ============================================================================

CREATE OR REPLACE FUNCTION transfer_between_accounts(
    p_user_id UUID,
    p_from_account_id UUID,
    p_to_account_id UUID,
    p_amount DECIMAL(12, 2),
    p_transfer_fee DECIMAL(10, 2) DEFAULT 0,
    p_description TEXT DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
    v_transfer_id UUID;
    v_from_balance DECIMAL(12, 2);
BEGIN
    -- Validate user owns both accounts
    IF NOT EXISTS (
        SELECT 1 FROM bank_accounts 
        WHERE id = p_from_account_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Source account not found or access denied';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM bank_accounts 
        WHERE id = p_to_account_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Destination account not found or access denied';
    END IF;

    -- Check sufficient balance
    SELECT balance INTO v_from_balance 
    FROM bank_accounts 
    WHERE id = p_from_account_id;

    IF v_from_balance < (p_amount + p_transfer_fee) THEN
        RAISE EXCEPTION 'Insufficient balance in source account';
    END IF;

    -- Deduct from source account (amount + fee)
    UPDATE bank_accounts 
    SET balance = balance - (p_amount + p_transfer_fee)
    WHERE id = p_from_account_id;

    -- Add to destination account
    UPDATE bank_accounts 
    SET balance = balance + p_amount
    WHERE id = p_to_account_id;

    -- Create transfer record
    INSERT INTO account_transfers (
        user_id,
        from_account_id,
        to_account_id,
        amount,
        transfer_fee,
        description,
        date
    ) VALUES (
        p_user_id,
        p_from_account_id,
        p_to_account_id,
        p_amount,
        p_transfer_fee,
        p_description,
        p_date
    ) RETURNING id INTO v_transfer_id;

    RETURN v_transfer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SAMPLE DATA (Optional - uncomment to add demo accounts)
-- ============================================================================

/*
-- Insert sample bank accounts for testing
-- Replace 'YOUR_USER_ID' with actual user UUID

INSERT INTO bank_accounts (user_id, account_name, bank_name, account_type, account_number, balance, color, icon) VALUES
('YOUR_USER_ID', 'Main Checking', 'Chase Bank', 'checking', '****1234', 5000.00, '#3b82f6', 'Building2'),
('YOUR_USER_ID', 'Emergency Savings', 'Ally Bank', 'savings', '****5678', 10000.00, '#10b981', 'PiggyBank'),
('YOUR_USER_ID', 'Cash Wallet', NULL, 'cash', NULL, 500.00, '#f59e0b', 'Wallet'),
('YOUR_USER_ID', 'Investment Account', 'Vanguard', 'investment', '****9012', 25000.00, '#8b5cf6', 'TrendingUp');
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
SELECT 'Bank Accounts Migration Complete!' AS status;
SELECT 'Tables created: bank_accounts, account_transfers' AS tables;
SELECT 'Indexes created: 7' AS indexes;
SELECT 'RLS Policies created: 8' AS policies;
SELECT 'Functions created: transfer_between_accounts()' AS functions;
