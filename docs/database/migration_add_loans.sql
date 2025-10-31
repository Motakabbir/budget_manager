-- ============================================================================
-- LOANS MODULE MIGRATION
-- Phase 3: Loan Management (Loans Given & Loans Taken)
-- ============================================================================
-- Description: Complete loan management system with payment tracking
-- Author: Budget Manager Development Team
-- Date: October 31, 2025
-- Version: 1.0
-- ============================================================================

-- ============================================================================
-- LOANS TABLE
-- Stores both loans given (lent to others) and loans taken (borrowed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Loan Type and Party Info
    loan_type TEXT NOT NULL CHECK (loan_type IN ('given', 'taken')),
    party_name TEXT NOT NULL, -- Borrower name (for given) or Lender name (for taken)
    
    -- Loan Amounts
    principal_amount DECIMAL(12,2) NOT NULL CHECK (principal_amount > 0),
    interest_rate DECIMAL(5,2) DEFAULT 0 CHECK (interest_rate >= 0), -- Annual interest rate %
    interest_type TEXT DEFAULT 'simple' CHECK (interest_type IN ('simple', 'compound', 'none')),
    total_amount DECIMAL(12,2), -- Total amount including interest (calculated)
    amount_paid DECIMAL(12,2) DEFAULT 0 CHECK (amount_paid >= 0),
    outstanding_balance DECIMAL(12,2), -- Calculated: total_amount - amount_paid
    
    -- Loan Terms
    start_date DATE NOT NULL,
    end_date DATE, -- Expected completion date
    payment_frequency TEXT DEFAULT 'monthly' CHECK (payment_frequency IN ('one-time', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly')),
    installment_amount DECIMAL(12,2), -- For installment loans
    
    -- Status and Metadata
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'cancelled')),
    contact_info TEXT, -- Phone/email of borrower/lender
    purpose TEXT, -- Loan purpose/reason
    collateral TEXT, -- Any collateral information
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_end_date CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT valid_amount_paid CHECK (amount_paid <= total_amount)
);

-- ============================================================================
-- LOAN PAYMENTS TABLE
-- Tracks all payments made for loans (both given and taken)
-- ============================================================================

CREATE TABLE IF NOT EXISTS loan_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    
    -- Payment Details
    payment_amount DECIMAL(12,2) NOT NULL CHECK (payment_amount > 0),
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash', -- cash, bank_transfer, card, check, online
    
    -- Payment Breakdown
    principal_paid DECIMAL(12,2) DEFAULT 0,
    interest_paid DECIMAL(12,2) DEFAULT 0,
    
    -- Integration with other modules
    from_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL, -- For loans taken (paying from account)
    to_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL, -- For loans given (receiving into account)
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL, -- Link to transaction record
    
    -- Balance tracking
    outstanding_before DECIMAL(12,2), -- Balance before this payment
    outstanding_after DECIMAL(12,2), -- Balance after this payment
    
    -- Metadata
    notes TEXT,
    receipt_url TEXT, -- Optional receipt/proof of payment
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MODIFY EXISTING TABLES
-- Add loan_id column to transactions table for integration
-- ============================================================================

-- Add loan_id to transactions if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'loan_id'
    ) THEN
        ALTER TABLE transactions ADD COLUMN loan_id UUID REFERENCES loans(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_loan_type ON loans(loan_type);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_start_date ON loans(start_date);
CREATE INDEX IF NOT EXISTS idx_loans_end_date ON loans(end_date);

CREATE INDEX IF NOT EXISTS idx_loan_payments_user_id ON loan_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_date ON loan_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_loan_payments_from_account ON loan_payments(from_account_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_to_account ON loan_payments(to_account_id);

CREATE INDEX IF NOT EXISTS idx_transactions_loan_id ON transactions(loan_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate total loan amount with interest
CREATE OR REPLACE FUNCTION calculate_loan_total(
    p_principal DECIMAL,
    p_rate DECIMAL,
    p_interest_type TEXT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
    v_years DECIMAL;
    v_total DECIMAL;
BEGIN
    -- If no interest or no end date, return principal
    IF p_rate = 0 OR p_interest_type = 'none' OR p_end_date IS NULL THEN
        RETURN p_principal;
    END IF;
    
    -- Calculate years (can be fractional)
    v_years := EXTRACT(EPOCH FROM (p_end_date - p_start_date)) / (365.25 * 24 * 60 * 60);
    
    -- Calculate based on interest type
    IF p_interest_type = 'simple' THEN
        -- Simple interest: Total = P(1 + rt)
        v_total := p_principal * (1 + (p_rate / 100) * v_years);
    ELSIF p_interest_type = 'compound' THEN
        -- Compound interest (annually): Total = P(1 + r)^t
        v_total := p_principal * POWER(1 + (p_rate / 100), v_years);
    ELSE
        v_total := p_principal;
    END IF;
    
    RETURN ROUND(v_total, 2);
END;
$$;

-- Trigger to automatically calculate total_amount and outstanding_balance
CREATE OR REPLACE FUNCTION update_loan_calculations()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Calculate total amount with interest
    NEW.total_amount := calculate_loan_total(
        NEW.principal_amount,
        NEW.interest_rate,
        NEW.interest_type,
        NEW.start_date,
        NEW.end_date
    );
    
    -- Calculate outstanding balance
    NEW.outstanding_balance := NEW.total_amount - COALESCE(NEW.amount_paid, 0);
    
    -- Update status based on outstanding balance
    IF NEW.outstanding_balance <= 0 THEN
        NEW.status := 'completed';
    END IF;
    
    -- Update timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_loan_calculations
    BEFORE INSERT OR UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION update_loan_calculations();

-- ============================================================================
-- FUNCTION: Make Loan Payment (for loans taken - paying to lender)
-- ============================================================================

CREATE OR REPLACE FUNCTION make_loan_payment(
    p_loan_id UUID,
    p_payment_amount DECIMAL,
    p_from_account_id UUID DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'cash',
    p_payment_date DATE DEFAULT CURRENT_DATE,
    p_notes TEXT DEFAULT NULL
)
RETURNS loan_payments
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_loan loans;
    v_account bank_accounts;
    v_payment loan_payments;
    v_user_id UUID;
    v_principal_portion DECIMAL;
    v_interest_portion DECIMAL;
    v_remaining_principal DECIMAL;
    v_remaining_interest DECIMAL;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- Validate loan exists and belongs to user
    SELECT * INTO v_loan 
    FROM loans 
    WHERE id = p_loan_id AND user_id = v_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan not found';
    END IF;
    
    -- Only for loans taken (you're paying someone)
    IF v_loan.loan_type != 'taken' THEN
        RAISE EXCEPTION 'This function is only for loans taken (borrowed)';
    END IF;
    
    IF v_loan.status NOT IN ('active') THEN
        RAISE EXCEPTION 'Loan is not active';
    END IF;
    
    -- Validate payment amount
    IF p_payment_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be positive';
    END IF;
    
    IF p_payment_amount > v_loan.outstanding_balance THEN
        RAISE EXCEPTION 'Payment amount exceeds outstanding balance';
    END IF;
    
    -- If paying from bank account, validate and deduct
    IF p_from_account_id IS NOT NULL THEN
        SELECT * INTO v_account 
        FROM bank_accounts 
        WHERE id = p_from_account_id AND user_id = v_user_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Bank account not found';
        END IF;
        
        IF v_account.balance < p_payment_amount THEN
            RAISE EXCEPTION 'Insufficient bank account balance';
        END IF;
        
        -- Deduct from bank account
        UPDATE bank_accounts 
        SET balance = balance - p_payment_amount,
            updated_at = NOW()
        WHERE id = p_from_account_id;
    END IF;
    
    -- Calculate principal and interest portions
    -- Simple approach: Apply to interest first, then principal
    v_remaining_interest := (v_loan.total_amount - v_loan.principal_amount) - 
                           (SELECT COALESCE(SUM(interest_paid), 0) FROM loan_payments WHERE loan_id = p_loan_id);
    v_remaining_principal := v_loan.principal_amount - 
                            (SELECT COALESCE(SUM(principal_paid), 0) FROM loan_payments WHERE loan_id = p_loan_id);
    
    IF v_remaining_interest > 0 THEN
        v_interest_portion := LEAST(p_payment_amount, v_remaining_interest);
        v_principal_portion := p_payment_amount - v_interest_portion;
    ELSE
        v_interest_portion := 0;
        v_principal_portion := p_payment_amount;
    END IF;
    
    -- Insert payment record
    INSERT INTO loan_payments (
        user_id,
        loan_id,
        payment_amount,
        payment_date,
        payment_method,
        from_account_id,
        principal_paid,
        interest_paid,
        outstanding_before,
        outstanding_after,
        notes
    ) VALUES (
        v_user_id,
        p_loan_id,
        p_payment_amount,
        p_payment_date,
        p_payment_method,
        p_from_account_id,
        v_principal_portion,
        v_interest_portion,
        v_loan.outstanding_balance,
        v_loan.outstanding_balance - p_payment_amount,
        p_notes
    ) RETURNING * INTO v_payment;
    
    -- Update loan amount_paid
    UPDATE loans 
    SET amount_paid = amount_paid + p_payment_amount,
        updated_at = NOW()
    WHERE id = p_loan_id;
    
    RETURN v_payment;
END;
$$;

-- ============================================================================
-- FUNCTION: Receive Loan Payment (for loans given - receiving from borrower)
-- ============================================================================

CREATE OR REPLACE FUNCTION receive_loan_payment(
    p_loan_id UUID,
    p_payment_amount DECIMAL,
    p_to_account_id UUID DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'cash',
    p_payment_date DATE DEFAULT CURRENT_DATE,
    p_notes TEXT DEFAULT NULL
)
RETURNS loan_payments
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_loan loans;
    v_payment loan_payments;
    v_user_id UUID;
    v_principal_portion DECIMAL;
    v_interest_portion DECIMAL;
    v_remaining_principal DECIMAL;
    v_remaining_interest DECIMAL;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- Validate loan exists and belongs to user
    SELECT * INTO v_loan 
    FROM loans 
    WHERE id = p_loan_id AND user_id = v_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan not found';
    END IF;
    
    -- Only for loans given (you're receiving payment)
    IF v_loan.loan_type != 'given' THEN
        RAISE EXCEPTION 'This function is only for loans given (lent)';
    END IF;
    
    IF v_loan.status NOT IN ('active', 'defaulted') THEN
        RAISE EXCEPTION 'Loan is not active';
    END IF;
    
    -- Validate payment amount
    IF p_payment_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be positive';
    END IF;
    
    IF p_payment_amount > v_loan.outstanding_balance THEN
        RAISE EXCEPTION 'Payment amount exceeds outstanding balance';
    END IF;
    
    -- If receiving into bank account, add to balance
    IF p_to_account_id IS NOT NULL THEN
        UPDATE bank_accounts 
        SET balance = balance + p_payment_amount,
            updated_at = NOW()
        WHERE id = p_to_account_id AND user_id = v_user_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Bank account not found';
        END IF;
    END IF;
    
    -- Calculate principal and interest portions
    v_remaining_interest := (v_loan.total_amount - v_loan.principal_amount) - 
                           (SELECT COALESCE(SUM(interest_paid), 0) FROM loan_payments WHERE loan_id = p_loan_id);
    v_remaining_principal := v_loan.principal_amount - 
                            (SELECT COALESCE(SUM(principal_paid), 0) FROM loan_payments WHERE loan_id = p_loan_id);
    
    IF v_remaining_interest > 0 THEN
        v_interest_portion := LEAST(p_payment_amount, v_remaining_interest);
        v_principal_portion := p_payment_amount - v_interest_portion;
    ELSE
        v_interest_portion := 0;
        v_principal_portion := p_payment_amount;
    END IF;
    
    -- Insert payment record
    INSERT INTO loan_payments (
        user_id,
        loan_id,
        payment_amount,
        payment_date,
        payment_method,
        to_account_id,
        principal_paid,
        interest_paid,
        outstanding_before,
        outstanding_after,
        notes
    ) VALUES (
        v_user_id,
        p_loan_id,
        p_payment_amount,
        p_payment_date,
        p_payment_method,
        p_to_account_id,
        v_principal_portion,
        v_interest_portion,
        v_loan.outstanding_balance,
        v_loan.outstanding_balance - p_payment_amount,
        p_notes
    ) RETURNING * INTO v_payment;
    
    -- Update loan amount_paid
    UPDATE loans 
    SET amount_paid = amount_paid + p_payment_amount,
        updated_at = NOW()
    WHERE id = p_loan_id;
    
    RETURN v_payment;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - loans
-- ============================================================================

CREATE POLICY "Users can view own loans" 
ON loans FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own loans" 
ON loans FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loans" 
ON loans FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loans" 
ON loans FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - loan_payments
-- ============================================================================

CREATE POLICY "Users can view own loan payments" 
ON loan_payments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own loan payments" 
ON loan_payments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loan payments" 
ON loan_payments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loan payments" 
ON loan_payments FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION calculate_loan_total TO authenticated;
GRANT EXECUTE ON FUNCTION make_loan_payment TO authenticated;
GRANT EXECUTE ON FUNCTION receive_loan_payment TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (run these to verify installation)
-- ============================================================================

-- Check tables created
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('loans', 'loan_payments');

-- Check RLS enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('loans', 'loan_payments');

-- Check triggers
-- SELECT tgname FROM pg_trigger WHERE tgrelid IN ('loans'::regclass);

-- Check functions
-- SELECT proname FROM pg_proc WHERE proname IN ('calculate_loan_total', 'make_loan_payment', 'receive_loan_payment');

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
