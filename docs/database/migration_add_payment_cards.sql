-- ============================================================================
-- PAYMENT CARDS MODULE - DATABASE MIGRATION
-- ============================================================================
-- This migration adds debit and credit card management functionality
-- Execute this in Supabase SQL Editor after the bank accounts migration
-- ============================================================================

-- ============================================================================
-- TABLE: payment_cards
-- Stores user's debit and credit cards
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_name TEXT NOT NULL,
    card_type TEXT NOT NULL CHECK (card_type IN ('debit', 'credit')),
    card_network TEXT, -- Visa, Mastercard, Amex, Discover, etc.
    last_four_digits TEXT, -- Last 4 digits only (e.g., "1234")
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL, -- Linked account for debit cards
    
    -- Credit Card Specific Fields
    credit_limit DECIMAL(12, 2), -- NULL for debit cards
    current_balance DECIMAL(12, 2) NOT NULL DEFAULT 0, -- Outstanding balance for credit cards
    available_credit DECIMAL(12, 2), -- Calculated: credit_limit - current_balance
    interest_rate DECIMAL(5, 2), -- APR percentage (e.g., 18.99)
    billing_cycle_day INT, -- Day of month billing cycle starts (1-31)
    payment_due_day INT, -- Day of month payment is due (1-31)
    minimum_payment_percent DECIMAL(5, 2), -- Minimum payment as % of balance
    
    -- Card Details
    expiry_date DATE,
    cardholder_name TEXT,
    color TEXT NOT NULL DEFAULT '#6366f1', -- Card color for UI
    icon TEXT DEFAULT 'CreditCard', -- Lucide icon name
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: Credit cards must have credit_limit
    CONSTRAINT credit_card_must_have_limit CHECK (
        (card_type = 'debit') OR 
        (card_type = 'credit' AND credit_limit IS NOT NULL AND credit_limit > 0)
    )
);

-- ============================================================================
-- TABLE: card_payments
-- Tracks credit card payments (paying off the balance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS card_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES payment_cards(id) ON DELETE CASCADE,
    payment_amount DECIMAL(12, 2) NOT NULL CHECK (payment_amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT, -- bank_transfer, cash, check, auto-debit
    from_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL, -- Account used for payment
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MODIFY EXISTING TABLES
-- Add card_id and payment_method columns to transactions table
-- ============================================================================

-- Add card_id to transactions if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'card_id'
    ) THEN
        ALTER TABLE transactions ADD COLUMN card_id UUID REFERENCES payment_cards(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE transactions ADD COLUMN payment_method TEXT; -- cash, card, bank_transfer, etc.
    END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payment_cards_user_id ON payment_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_cards_card_type ON payment_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_payment_cards_is_active ON payment_cards(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_payment_cards_bank_account ON payment_cards(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_payment_cards_expiry ON payment_cards(expiry_date);

CREATE INDEX IF NOT EXISTS idx_card_payments_user_id ON card_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_card_payments_card_id ON card_payments(card_id);
CREATE INDEX IF NOT EXISTS idx_card_payments_date ON card_payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON transactions(card_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE payment_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - payment_cards
-- ============================================================================

CREATE POLICY "Users can view own payment cards" 
ON payment_cards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payment cards" 
ON payment_cards FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment cards" 
ON payment_cards FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment cards" 
ON payment_cards FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - card_payments
-- ============================================================================

CREATE POLICY "Users can view own card payments" 
ON card_payments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own card payments" 
ON card_payments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own card payments" 
ON card_payments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own card payments" 
ON card_payments FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS: Update updated_at timestamp
-- ============================================================================

-- Apply trigger to payment_cards
DROP TRIGGER IF EXISTS update_payment_cards_updated_at ON payment_cards;
CREATE TRIGGER update_payment_cards_updated_at
    BEFORE UPDATE ON payment_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to card_payments
DROP TRIGGER IF EXISTS update_card_payments_updated_at ON card_payments;
CREATE TRIGGER update_card_payments_updated_at
    BEFORE UPDATE ON card_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER: Auto-calculate available_credit for credit cards
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_available_credit()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.card_type = 'credit' AND NEW.credit_limit IS NOT NULL THEN
        NEW.available_credit := NEW.credit_limit - NEW.current_balance;
    ELSE
        NEW.available_credit := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_available_credit ON payment_cards;
CREATE TRIGGER trigger_calculate_available_credit
    BEFORE INSERT OR UPDATE ON payment_cards
    FOR EACH ROW
    EXECUTE FUNCTION calculate_available_credit();

-- ============================================================================
-- FUNCTION: Make credit card payment
-- Reduces credit card balance and optionally deducts from bank account
-- ============================================================================

CREATE OR REPLACE FUNCTION make_card_payment(
    p_user_id UUID,
    p_card_id UUID,
    p_payment_amount DECIMAL(12, 2),
    p_from_account_id UUID DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'bank_transfer',
    p_payment_date DATE DEFAULT CURRENT_DATE,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
    v_card_type TEXT;
    v_current_balance DECIMAL(12, 2);
    v_account_balance DECIMAL(12, 2);
BEGIN
    -- Validate user owns the card
    SELECT card_type, current_balance INTO v_card_type, v_current_balance
    FROM payment_cards 
    WHERE id = p_card_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card not found or access denied';
    END IF;

    -- Validate payment amount
    IF p_payment_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero';
    END IF;

    IF p_payment_amount > v_current_balance THEN
        RAISE EXCEPTION 'Payment amount cannot exceed current balance';
    END IF;

    -- If paying from bank account, validate and deduct
    IF p_from_account_id IS NOT NULL THEN
        SELECT balance INTO v_account_balance
        FROM bank_accounts
        WHERE id = p_from_account_id AND user_id = p_user_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Bank account not found or access denied';
        END IF;

        IF v_account_balance < p_payment_amount THEN
            RAISE EXCEPTION 'Insufficient balance in bank account';
        END IF;

        -- Deduct from bank account
        UPDATE bank_accounts 
        SET balance = balance - p_payment_amount
        WHERE id = p_from_account_id;
    END IF;

    -- Reduce credit card balance
    UPDATE payment_cards
    SET current_balance = current_balance - p_payment_amount
    WHERE id = p_card_id;

    -- Create payment record
    INSERT INTO card_payments (
        user_id,
        card_id,
        payment_amount,
        payment_date,
        payment_method,
        from_account_id,
        notes
    ) VALUES (
        p_user_id,
        p_card_id,
        p_payment_amount,
        p_payment_date,
        p_payment_method,
        p_from_account_id,
        p_notes
    ) RETURNING id INTO v_payment_id;

    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Add charge to credit card
-- Increases credit card balance when making a purchase
-- ============================================================================

CREATE OR REPLACE FUNCTION charge_credit_card(
    p_user_id UUID,
    p_card_id UUID,
    p_charge_amount DECIMAL(12, 2)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_available_credit DECIMAL(12, 2);
    v_card_type TEXT;
BEGIN
    -- Get card info
    SELECT card_type, available_credit INTO v_card_type, v_available_credit
    FROM payment_cards
    WHERE id = p_card_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card not found or access denied';
    END IF;

    -- Only credit cards can be charged
    IF v_card_type != 'credit' THEN
        RAISE EXCEPTION 'Can only charge credit cards';
    END IF;

    -- Check available credit
    IF p_charge_amount > v_available_credit THEN
        RAISE EXCEPTION 'Insufficient credit available';
    END IF;

    -- Add to balance
    UPDATE payment_cards
    SET current_balance = current_balance + p_charge_amount
    WHERE id = p_card_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEW: Card summary with payment info
-- ============================================================================

CREATE OR REPLACE VIEW card_summary AS
SELECT 
    pc.*,
    ba.account_name as linked_account_name,
    COALESCE(
        (SELECT SUM(payment_amount) 
         FROM card_payments 
         WHERE card_id = pc.id 
         AND payment_date >= DATE_TRUNC('month', CURRENT_DATE)),
        0
    ) as payments_this_month,
    COALESCE(
        (SELECT COUNT(*) 
         FROM transactions 
         WHERE card_id = pc.id),
        0
    ) as transaction_count
FROM payment_cards pc
LEFT JOIN bank_accounts ba ON pc.bank_account_id = ba.id;

-- ============================================================================
-- SAMPLE DATA (Optional - uncomment to add demo cards)
-- ============================================================================

/*
-- Insert sample payment cards for testing
-- Replace 'YOUR_USER_ID' with actual user UUID

INSERT INTO payment_cards (
    user_id, card_name, card_type, card_network, last_four_digits, 
    credit_limit, current_balance, interest_rate, billing_cycle_day, 
    payment_due_day, color, is_active
) VALUES
-- Credit Cards
('YOUR_USER_ID', 'Chase Sapphire', 'credit', 'Visa', '1234', 10000.00, 2500.00, 16.99, 1, 25, '#0066cc', true),
('YOUR_USER_ID', 'Amex Gold', 'credit', 'American Express', '5678', 15000.00, 5000.00, 18.99, 15, 10, '#d4af37', true),

-- Debit Cards
('YOUR_USER_ID', 'Chase Checking', 'debit', 'Visa', '9012', NULL, 0, NULL, NULL, NULL, '#3b82f6', true),
('YOUR_USER_ID', 'Ally Debit', 'debit', 'Mastercard', '3456', NULL, 0, NULL, NULL, NULL, '#10b981', true);
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
SELECT 'Payment Cards Migration Complete!' AS status;
SELECT 'Tables created: payment_cards, card_payments' AS tables;
SELECT 'Views created: card_summary' AS views;
SELECT 'Indexes created: 9' AS indexes;
SELECT 'RLS Policies created: 8' AS policies;
SELECT 'Functions created: make_card_payment(), charge_credit_card()' AS functions;
