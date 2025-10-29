-- Create recurring_transactions table
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

-- Create index
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_occurrence ON recurring_transactions (next_occurrence);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_active ON recurring_transactions (is_active)
WHERE
    is_active = true;

-- Enable Row Level Security
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own recurring transactions" ON recurring_transactions FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can create own recurring transactions" ON recurring_transactions FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update own recurring transactions" ON recurring_transactions FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete own recurring transactions" ON recurring_transactions FOR DELETE USING (auth.uid () = user_id);

-- Function to create transaction from recurring template
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

-- Add comment
COMMENT ON
TABLE recurring_transactions IS 'Stores templates for recurring income and expense transactions';

COMMENT ON FUNCTION create_recurring_transaction (UUID) IS 'Creates a new transaction from a recurring template and updates the next occurrence date';