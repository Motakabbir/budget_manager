# Loans Module - Technical Documentation

## Architecture Overview

The Loans module is a comprehensive financial tracking system built with React 19, TypeScript, Supabase (PostgreSQL), and TanStack Query. It follows the same architecture patterns as the Bank Accounts and Payment Cards modules.

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [TypeScript Types](#typescript-types)
3. [Backend Functions](#backend-functions)
4. [React Query Hooks](#react-query-hooks)
5. [Components](#components)
6. [State Management](#state-management)
7. [API Reference](#api-reference)
8. [Security & RLS](#security--rls)

---

## Database Schema

### Tables

#### `loans` Table

Stores loan records for both given (lent) and taken (borrowed) loans.

```sql
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loan_type TEXT NOT NULL CHECK (loan_type IN ('given', 'taken')),
    party_name TEXT NOT NULL,
    party_contact TEXT,
    principal_amount DECIMAL(15, 2) NOT NULL CHECK (principal_amount > 0),
    interest_rate DECIMAL(5, 2) DEFAULT 0 CHECK (interest_rate >= 0),
    interest_type TEXT DEFAULT 'none' CHECK (interest_type IN ('simple', 'compound', 'none')),
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    outstanding_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    due_date DATE,
    payment_frequency TEXT DEFAULT 'monthly' CHECK (payment_frequency IN (
        'one-time', 'daily', 'weekly', 'bi-weekly', 'monthly', 
        'quarterly', 'semi-annually', 'yearly'
    )),
    next_payment_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'cancelled')),
    loan_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    purpose TEXT,
    collateral TEXT,
    documents JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Fields:**
- `loan_type`: 'given' (lent) or 'taken' (borrowed)
- `interest_type`: 'simple', 'compound', or 'none'
- `total_amount`: Automatically calculated by trigger
- `outstanding_balance`: Automatically updated by payment functions

#### `loan_payments` Table

Stores detailed payment records with principal/interest breakdown.

```sql
CREATE TABLE loan_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    payment_amount DECIMAL(15, 2) NOT NULL CHECK (payment_amount > 0),
    principal_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
    interest_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT,
    from_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    to_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    outstanding_before DECIMAL(15, 2) NOT NULL,
    outstanding_after DECIMAL(15, 2) NOT NULL,
    late_fee DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    receipt_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Fields:**
- `principal_paid`: Amount applied to principal
- `interest_paid`: Amount applied to interest
- `outstanding_before/after`: Balance tracking
- `from_account_id`: For loans taken (payment source)
- `to_account_id`: For loans given (payment destination)

### Indexes

Performance optimization indexes:

```sql
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_loan_type ON loans(loan_type);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_date ON loans(due_date);
CREATE INDEX idx_loans_next_payment_date ON loans(next_payment_date);
CREATE INDEX idx_loans_start_date ON loans(start_date);
CREATE INDEX idx_loans_loan_account_id ON loans(loan_account_id);

CREATE INDEX idx_loan_payments_user_id ON loan_payments(user_id);
CREATE INDEX idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX idx_loan_payments_payment_date ON loan_payments(payment_date);
CREATE INDEX idx_loan_payments_from_account_id ON loan_payments(from_account_id);
CREATE INDEX idx_loan_payments_to_account_id ON loan_payments(to_account_id);
```

---

## Backend Functions

### 1. `calculate_loan_total()`

Calculates total loan amount including interest.

```sql
CREATE OR REPLACE FUNCTION calculate_loan_total(
    p_principal DECIMAL,
    p_rate DECIMAL,
    p_start_date DATE,
    p_due_date DATE,
    p_interest_type TEXT
) RETURNS DECIMAL AS $$
DECLARE
    v_total DECIMAL;
    v_years DECIMAL;
BEGIN
    -- No interest case
    IF p_interest_type = 'none' OR p_rate = 0 THEN
        RETURN p_principal;
    END IF;

    -- Calculate years
    v_years := EXTRACT(EPOCH FROM (COALESCE(p_due_date, CURRENT_DATE) - p_start_date)) / (365.25 * 86400);

    -- Simple interest: Total = Principal × (1 + Rate × Time)
    IF p_interest_type = 'simple' THEN
        v_total := p_principal * (1 + (p_rate / 100) * v_years);
    -- Compound interest: Total = Principal × (1 + Rate)^Time
    ELSIF p_interest_type = 'compound' THEN
        v_total := p_principal * POWER(1 + (p_rate / 100), v_years);
    ELSE
        v_total := p_principal;
    END IF;

    RETURN ROUND(v_total, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### 2. `make_loan_payment()`

Processes payment for loans taken (borrowed). Atomic transaction.

```sql
CREATE OR REPLACE FUNCTION make_loan_payment(
    p_user_id UUID,
    p_loan_id UUID,
    p_payment_amount DECIMAL,
    p_from_account_id UUID DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'bank_transfer',
    p_payment_date DATE DEFAULT CURRENT_DATE,
    p_late_fee DECIMAL DEFAULT 0,
    p_notes TEXT DEFAULT NULL,
    p_receipt_number TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_loan RECORD;
    v_payment_id UUID;
    v_principal_paid DECIMAL;
    v_interest_paid DECIMAL;
BEGIN
    -- Validate and lock loan
    SELECT * INTO v_loan FROM loans 
    WHERE id = p_loan_id AND user_id = p_user_id AND loan_type = 'taken'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan not found or not accessible';
    END IF;

    -- Validate payment amount
    IF p_payment_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be positive';
    END IF;

    IF p_payment_amount > v_loan.outstanding_balance THEN
        RAISE EXCEPTION 'Payment exceeds outstanding balance';
    END IF;

    -- Calculate interest and principal portions
    v_interest_paid := (v_loan.outstanding_balance - v_loan.principal_amount) * (p_payment_amount / v_loan.outstanding_balance);
    v_principal_paid := p_payment_amount - v_interest_paid;

    -- Deduct from bank account if specified
    IF p_from_account_id IS NOT NULL THEN
        UPDATE bank_accounts 
        SET balance = balance - p_payment_amount,
            updated_at = NOW()
        WHERE id = p_from_account_id AND user_id = p_user_id;
    END IF;

    -- Create payment record
    INSERT INTO loan_payments (
        user_id, loan_id, payment_amount, principal_paid, interest_paid,
        payment_date, payment_method, from_account_id,
        outstanding_before, outstanding_after, late_fee, notes, receipt_number
    ) VALUES (
        p_user_id, p_loan_id, p_payment_amount, v_principal_paid, v_interest_paid,
        p_payment_date, p_payment_method, p_from_account_id,
        v_loan.outstanding_balance, v_loan.outstanding_balance - p_payment_amount,
        p_late_fee, p_notes, p_receipt_number
    ) RETURNING id INTO v_payment_id;

    -- Update loan balance
    UPDATE loans 
    SET outstanding_balance = outstanding_balance - p_payment_amount,
        status = CASE 
            WHEN outstanding_balance - p_payment_amount <= 0 THEN 'completed'
            ELSE status 
        END,
        updated_at = NOW()
    WHERE id = p_loan_id;

    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;
```

### 3. `receive_loan_payment()`

Processes payment for loans given (lent). Similar to `make_loan_payment()` but deposits to account.

```sql
CREATE OR REPLACE FUNCTION receive_loan_payment(
    p_user_id UUID,
    p_loan_id UUID,
    p_payment_amount DECIMAL,
    p_to_account_id UUID DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'bank_transfer',
    p_payment_date DATE DEFAULT CURRENT_DATE,
    p_late_fee DECIMAL DEFAULT 0,
    p_notes TEXT DEFAULT NULL,
    p_receipt_number TEXT DEFAULT NULL
) RETURNS UUID AS $$
-- Similar implementation with account credit instead of debit
$$ LANGUAGE plpgsql;
```

### 4. `update_loan_calculations()` Trigger

Automatically calculates totals when loan is created or updated.

```sql
CREATE OR REPLACE FUNCTION update_loan_calculations()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total amount with interest
    NEW.total_amount := calculate_loan_total(
        NEW.principal_amount,
        NEW.interest_rate,
        NEW.start_date,
        NEW.due_date,
        NEW.interest_type
    );

    -- Initialize outstanding balance for new loans
    IF TG_OP = 'INSERT' THEN
        NEW.outstanding_balance := NEW.total_amount;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loans_calculate_trigger
    BEFORE INSERT OR UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION update_loan_calculations();
```

---

## TypeScript Types

### Core Types

```typescript
export type Loan = {
    id: string;
    user_id: string;
    loan_type: 'given' | 'taken';
    party_name: string;
    party_contact: string | null;
    principal_amount: number;
    interest_rate: number;
    interest_type: 'simple' | 'compound' | 'none';
    total_amount: number;
    outstanding_balance: number;
    start_date: string;
    due_date: string | null;
    payment_frequency: 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 
                      'monthly' | 'quarterly' | 'semi-annually' | 'yearly';
    next_payment_date: string | null;
    status: 'active' | 'completed' | 'defaulted' | 'cancelled';
    loan_account_id: string | null;
    purpose: string | null;
    collateral: string | null;
    documents: any | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type LoanPayment = {
    id: string;
    user_id: string;
    loan_id: string;
    payment_amount: number;
    principal_paid: number;
    interest_paid: number;
    payment_date: string;
    payment_method: string | null;
    from_account_id: string | null;
    to_account_id: string | null;
    outstanding_before: number;
    outstanding_after: number;
    late_fee: number;
    notes: string | null;
    receipt_number: string | null;
    created_at: string;
    updated_at: string;
};
```

---

## React Query Hooks

### Query Hooks

#### `useLoans()`
Fetches all user loans with 5-minute cache.

```typescript
const { data: loans, isLoading, error } = useLoans();
```

#### `useLoanPayments()`
Fetches all payment records with 5-minute cache.

```typescript
const { data: payments, isLoading, error } = useLoanPayments();
```

### Mutation Hooks

#### `useCreateLoan()`
Creates a new loan.

```typescript
const createLoan = useCreateLoan();

createLoan.mutate({
    loan_type: 'given',
    party_name: 'John Doe',
    principal_amount: 5000,
    interest_rate: 5.5,
    interest_type: 'simple',
    start_date: '2025-01-01',
    // ... other fields
});
```

#### `useUpdateLoan()`
Updates existing loan.

```typescript
const updateLoan = useUpdateLoan();

updateLoan.mutate({
    id: 'loan-id',
    updates: { status: 'defaulted' }
});
```

#### `useDeleteLoan()`
Deletes loan and all payments.

```typescript
const deleteLoan = useDeleteLoan();

deleteLoan.mutate('loan-id');
```

#### `useMakeLoanPayment()`
Processes payment for loans taken.

```typescript
const makeLoanPayment = useMakeLoanPayment();

makeLoanPayment.mutate({
    loan_id: 'loan-id',
    payment_amount: 500,
    from_account_id: 'account-id',
    payment_method: 'bank_transfer',
    payment_date: '2025-10-31',
});
```

#### `useReceiveLoanPayment()`
Processes payment for loans given.

```typescript
const receiveLoanPayment = useReceiveLoanPayment();

receiveLoanPayment.mutate({
    loan_id: 'loan-id',
    payment_amount: 500,
    to_account_id: 'account-id',
    payment_method: 'bank_transfer',
});
```

---

## Components

### LoanCard

Displays loan information with progress tracking.

**Props:**
```typescript
interface LoanCardProps {
    loan: Loan;
    onEdit?: (loan: Loan) => void;
    onMakePayment?: (loan: Loan) => void;
}
```

**Features:**
- Color-coded by loan type (green/red)
- Progress bar showing repayment
- Financial summary display
- Status badges
- Overdue warnings
- Action menu (edit, delete, payment)

### AddLoanDialog

Form for creating new loans.

**Features:**
- Loan type selection
- Party information input
- Interest configuration
- Date management
- Bank account linking
- Purpose and collateral tracking
- Validation and error handling

### LoanPaymentDialog

Smart payment processing dialog.

**Props:**
```typescript
interface LoanPaymentDialogProps {
    loan: Loan;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}
```

**Features:**
- Adapts UI based on loan type
- Loan summary display
- Payment amount validation
- Bank account selection
- Payment method options
- Late fee and receipt tracking
- RPC function integration

---

## State Management

### Zustand Store

Global state managed in `src/lib/store/index.ts`:

```typescript
interface BudgetStore {
    loans: Loan[];
    loanPayments: LoanPayment[];
    
    setLoans: (loans: Loan[]) => void;
    setLoanPayments: (payments: LoanPayment[]) => void;
    
    fetchLoans: () => Promise<void>;
    fetchLoanPayments: () => Promise<void>;
    
    addLoan: (loan: Omit<Loan, 'id' | 'user_id' | ...>) => Promise<void>;
    updateLoan: (id: string, updates: Partial<Loan>) => Promise<void>;
    deleteLoan: (id: string) => Promise<void>;
    
    makeLoanPayment: (payment: {...}) => Promise<void>;
    receiveLoanPayment: (payment: {...}) => Promise<void>;
    deleteLoanPayment: (id: string) => Promise<void>;
}
```

---

## API Reference

### RPC Functions

#### `make_loan_payment`

**Parameters:**
- `p_user_id`: UUID - User ID
- `p_loan_id`: UUID - Loan ID
- `p_payment_amount`: DECIMAL - Payment amount
- `p_from_account_id`: UUID (optional) - Source bank account
- `p_payment_method`: TEXT (optional) - Payment method
- `p_payment_date`: DATE (optional) - Payment date
- `p_late_fee`: DECIMAL (optional) - Late fee amount
- `p_notes`: TEXT (optional) - Payment notes
- `p_receipt_number`: TEXT (optional) - Receipt number

**Returns:** UUID - Payment ID

**Example:**
```typescript
const { data, error } = await supabase.rpc('make_loan_payment', {
    p_user_id: userId,
    p_loan_id: loanId,
    p_payment_amount: 500,
    p_from_account_id: accountId,
});
```

#### `receive_loan_payment`

Same parameters as `make_loan_payment` but uses `p_to_account_id` instead of `p_from_account_id`.

---

## Security & RLS

### Row Level Security Policies

All tables have RLS enabled with the following policies:

**loans table:**
```sql
-- Users can only see their own loans
CREATE POLICY "Users can view own loans"
    ON loans FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own loans
CREATE POLICY "Users can insert own loans"
    ON loans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own loans
CREATE POLICY "Users can update own loans"
    ON loans FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own loans
CREATE POLICY "Users can delete own loans"
    ON loans FOR DELETE
    USING (auth.uid() = user_id);
```

**loan_payments table:**
Similar RLS policies ensure users can only access their own payment records.

### Security Considerations

1. **Data Isolation**: RLS ensures complete user data separation
2. **Atomic Operations**: Payment functions use transactions
3. **Validation**: All inputs validated before processing
4. **Balance Checks**: Prevents over-payment
5. **Account Verification**: Only user's accounts can be used
6. **Audit Trail**: Complete payment history preserved

---

## Performance Optimization

1. **Indexes**: All foreign keys and frequently queried fields indexed
2. **Query Caching**: 5-minute stale time for React Query
3. **Lazy Loading**: LoansPage lazy loaded in App.tsx
4. **useMemo**: Expensive calculations cached
5. **Batch Updates**: Related queries invalidated together

---

## Testing Recommendations

### Unit Tests
- Interest calculation functions
- Payment split logic
- Balance calculations
- Date handling

### Integration Tests
- Loan creation flow
- Payment processing
- Account integration
- Status transitions

### E2E Tests
- Complete loan lifecycle
- Payment workflows
- Multi-user scenarios

---

## Migration Guide

### Running the Migration

```bash
# Run migration SQL file
psql -d your_database < docs/database/migration_add_loans.sql
```

### Rollback (if needed)

```sql
DROP TABLE IF EXISTS loan_payments CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP FUNCTION IF EXISTS calculate_loan_total CASCADE;
DROP FUNCTION IF EXISTS make_loan_payment CASCADE;
DROP FUNCTION IF EXISTS receive_loan_payment CASCADE;
```

---

## Future Enhancements

Potential features for future development:

1. **Automated Reminders**: Email/SMS for upcoming payments
2. **Payment Schedules**: Auto-generate payment plans
3. **Loan Templates**: Common loan configurations
4. **Document Uploads**: Attach contracts and agreements
5. **Loan Calculator**: Interactive interest calculations
6. **Export Functionality**: CSV/PDF reports
7. **Multi-Currency**: Support for different currencies
8. **Loan Refinancing**: Restructure existing loans

---

## Support

For issues or questions:
- Check [User Guide](./LOANS_USER_GUIDE.md)
- Review database schema
- Check application logs
- Verify RLS policies
- Test RPC functions directly

---

**Last Updated:** October 31, 2025  
**Version:** 1.0.0  
**Module:** Phase 3 - Loans
