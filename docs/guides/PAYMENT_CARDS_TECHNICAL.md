# Payment Cards Technical Documentation

## Architecture Overview

The Payment Cards module is a full-stack feature implementing credit and debit card management with real-time balance tracking, payment processing, and transaction integration.

### Technology Stack

- **Frontend**: React 19 + TypeScript 5 + Vite 7
- **UI**: Tailwind CSS 4 + shadcn/ui
- **State Management**: Zustand (global) + TanStack Query (server state)
- **Database**: PostgreSQL (Supabase) with Row Level Security
- **Data Fetching**: React Query with 5-minute cache

---

## Database Layer

### Tables

#### 1. payment_cards
Primary table for storing credit and debit card information.

```sql
CREATE TABLE payment_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Info
    card_name TEXT NOT NULL,
    card_type TEXT NOT NULL CHECK (card_type IN ('credit', 'debit')),
    card_network TEXT, -- Visa, Mastercard, Amex, etc.
    last_four_digits TEXT CHECK (LENGTH(last_four_digits) = 4),
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    
    -- Credit Card Specific
    credit_limit DECIMAL(12,2),
    current_balance DECIMAL(12,2) DEFAULT 0,
    available_credit DECIMAL(12,2), -- Auto-calculated
    interest_rate DECIMAL(5,2), -- APR percentage
    billing_cycle_day INTEGER CHECK (billing_cycle_day BETWEEN 1 AND 31),
    payment_due_day INTEGER CHECK (payment_due_day BETWEEN 1 AND 31),
    minimum_payment_percent DECIMAL(5,2) DEFAULT 2.0,
    
    -- Additional Info
    expiry_date DATE,
    cardholder_name TEXT,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT 'CreditCard',
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT credit_card_has_limit CHECK (
        card_type != 'credit' OR credit_limit IS NOT NULL
    )
);
```

**Key Points:**
- `card_type`: Enum-like constraint for 'credit' or 'debit'
- `available_credit`: Auto-calculated via trigger
- `credit_limit`: Required for credit cards via CHECK constraint
- `last_four_digits`: Fixed length for security
- `bank_account_id`: For debit card linking

**Indexes:**
```sql
CREATE INDEX idx_payment_cards_user_id ON payment_cards(user_id);
CREATE INDEX idx_payment_cards_card_type ON payment_cards(card_type);
CREATE INDEX idx_payment_cards_is_active ON payment_cards(is_active) WHERE is_active = true;
CREATE INDEX idx_payment_cards_bank_account ON payment_cards(bank_account_id);
CREATE INDEX idx_payment_cards_expiry ON payment_cards(expiry_date);
```

#### 2. card_payments
Stores all payment transactions for credit cards.

```sql
CREATE TABLE card_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES payment_cards(id) ON DELETE CASCADE,
    
    -- Payment Details
    payment_amount DECIMAL(12,2) NOT NULL CHECK (payment_amount > 0),
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT, -- bank_transfer, cash, check, auto-debit
    from_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Points:**
- `payment_amount`: Must be positive
- `from_account_id`: Links to bank account for automatic deduction
- `payment_method`: Flexible text field for method tracking

**Indexes:**
```sql
CREATE INDEX idx_card_payments_user_id ON card_payments(user_id);
CREATE INDEX idx_card_payments_card_id ON card_payments(card_id);
CREATE INDEX idx_card_payments_date ON card_payments(payment_date);
```

#### 3. transactions (Extended)
Existing table with new columns for payment tracking.

```sql
-- New columns added:
ALTER TABLE transactions 
    ADD COLUMN card_id UUID REFERENCES payment_cards(id) ON DELETE SET NULL,
    ADD COLUMN account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    ADD COLUMN payment_method TEXT;

CREATE INDEX idx_transactions_card_id ON transactions(card_id);
```

**Purpose:**
- Track which card/account was used for each transaction
- Enable payment method analysis
- Support transaction reconciliation

---

## Database Functions

### 1. make_card_payment()

Atomic function for processing card payments with optional bank account deduction.

```sql
CREATE OR REPLACE FUNCTION make_card_payment(
    p_card_id UUID,
    p_payment_amount DECIMAL,
    p_from_account_id UUID DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'bank_transfer',
    p_payment_date DATE DEFAULT CURRENT_DATE,
    p_notes TEXT DEFAULT NULL
)
RETURNS card_payments
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_card payment_cards;
    v_account bank_accounts;
    v_payment card_payments;
    v_user_id UUID;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- Validate card exists and belongs to user
    SELECT * INTO v_card 
    FROM payment_cards 
    WHERE id = p_card_id AND user_id = v_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card not found';
    END IF;
    
    IF NOT v_card.is_active THEN
        RAISE EXCEPTION 'Card is not active';
    END IF;
    
    -- Validate payment amount
    IF p_payment_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be positive';
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
    
    -- Reduce card balance
    UPDATE payment_cards 
    SET current_balance = GREATEST(current_balance - p_payment_amount, 0),
        updated_at = NOW()
    WHERE id = p_card_id;
    
    -- Insert payment record
    INSERT INTO card_payments (
        user_id,
        card_id,
        payment_amount,
        payment_date,
        payment_method,
        from_account_id,
        notes
    ) VALUES (
        v_user_id,
        p_card_id,
        p_payment_amount,
        p_payment_date,
        p_payment_method,
        p_from_account_id,
        p_notes
    ) RETURNING * INTO v_payment;
    
    RETURN v_payment;
END;
$$;
```

**Security:**
- `SECURITY DEFINER`: Runs with function owner's privileges
- Validates user ownership of card and account
- Atomic: All changes or none (transaction-safe)
- Prevents negative balances with `GREATEST()`

**Usage:**
```typescript
const { data, error } = await supabase.rpc('make_card_payment', {
    p_card_id: 'uuid-here',
    p_payment_amount: 500.00,
    p_from_account_id: 'account-uuid',
    p_payment_method: 'bank_transfer',
    p_notes: 'Monthly payment'
});
```

### 2. charge_credit_card()

Add charges to a credit card with validation.

```sql
CREATE OR REPLACE FUNCTION charge_credit_card(
    p_card_id UUID,
    p_amount DECIMAL
)
RETURNS payment_cards
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_card payment_cards;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Get card
    SELECT * INTO v_card 
    FROM payment_cards 
    WHERE id = p_card_id AND user_id = v_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card not found';
    END IF;
    
    IF v_card.card_type != 'credit' THEN
        RAISE EXCEPTION 'Can only charge credit cards';
    END IF;
    
    -- Check available credit
    IF v_card.available_credit < p_amount THEN
        RAISE EXCEPTION 'Insufficient available credit';
    END IF;
    
    -- Add to balance
    UPDATE payment_cards 
    SET current_balance = current_balance + p_amount,
        updated_at = NOW()
    WHERE id = p_card_id
    RETURNING * INTO v_card;
    
    RETURN v_card;
END;
$$;
```

### 3. calculate_available_credit() Trigger

Automatically maintains available credit calculation.

```sql
CREATE OR REPLACE FUNCTION calculate_available_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.card_type = 'credit' AND NEW.credit_limit IS NOT NULL THEN
        NEW.available_credit := NEW.credit_limit - COALESCE(NEW.current_balance, 0);
    ELSE
        NEW.available_credit := NULL;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calculate_available_credit
    BEFORE INSERT OR UPDATE ON payment_cards
    FOR EACH ROW
    EXECUTE FUNCTION calculate_available_credit();
```

**Behavior:**
- Fires on every INSERT/UPDATE of payment_cards
- Only calculates for credit cards
- Sets to NULL for debit cards
- Uses COALESCE to handle NULL balances

---

## Row Level Security (RLS)

All tables enforce strict user isolation:

```sql
-- payment_cards policies
CREATE POLICY "Users can view own cards" ON payment_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own cards" ON payment_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" ON payment_cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" ON payment_cards
    FOR DELETE USING (auth.uid() = user_id);

-- card_payments policies
CREATE POLICY "Users can view own payments" ON card_payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments" ON card_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments" ON card_payments
    FOR DELETE USING (auth.uid() = user_id);
```

**Security Features:**
- No user can see another user's cards or payments
- INSERT operations validated at database level
- UPDATE/DELETE operations restricted to owners
- Functions use `auth.uid()` for user context

---

## TypeScript Types

### Database Types (`database.types.ts`)

```typescript
export type PaymentCard = {
    id: string;
    user_id: string;
    card_name: string;
    card_type: 'credit' | 'debit';
    card_network: string | null;
    last_four_digits: string | null;
    bank_account_id: string | null;
    credit_limit: number | null;
    current_balance: number | null;
    available_credit: number | null;
    interest_rate: number | null;
    billing_cycle_day: number | null;
    payment_due_day: number | null;
    minimum_payment_percent: number | null;
    expiry_date: string | null;
    cardholder_name: string | null;
    color: string;
    icon: string;
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type CardPayment = {
    id: string;
    user_id: string;
    card_id: string;
    payment_amount: number;
    payment_date: string;
    payment_method: string | null;
    from_account_id: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

// Function parameter types
export type MakeCardPaymentParams = {
    card_id: string;
    payment_amount: number;
    from_account_id?: string;
    payment_method?: string;
    payment_date?: string;
    notes?: string;
};
```

---

## React Query Hooks

### Query Hooks

```typescript
// Fetch all payment cards
export function usePaymentCards() {
    return useQuery({
        queryKey: queryKeys.paymentCards,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('payment_cards')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data as PaymentCard[];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Fetch all card payments
export function useCardPayments() {
    return useQuery({
        queryKey: queryKeys.cardPayments,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('card_payments')
                .select(`
                    *,
                    card:payment_cards(card_name, card_type, color)
                `)
                .order('payment_date', { ascending: false });
            
            if (error) throw error;
            return data as (CardPayment & { card: PaymentCard })[];
        },
        staleTime: 5 * 60 * 1000,
    });
}
```

### Mutation Hooks

```typescript
// Create payment card
export function useCreatePaymentCard() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (cardData: Omit<PaymentCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
            const { data, error } = await supabase
                .from('payment_cards')
                .insert(cardData)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.paymentCards });
            toast.success('Card added successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to add card: ${error.message}`);
        },
    });
}

// Make card payment (uses database function)
export function useMakeCardPayment() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (params: MakeCardPaymentParams) => {
            const { data, error } = await supabase.rpc('make_card_payment', {
                p_card_id: params.card_id,
                p_payment_amount: params.payment_amount,
                p_from_account_id: params.from_account_id || undefined,
                p_payment_method: params.payment_method || undefined,
                p_payment_date: params.payment_date || undefined,
                p_notes: params.notes || undefined,
            });
            
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            // Invalidate all related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.paymentCards });
            queryClient.invalidateQueries({ queryKey: queryKeys.cardPayments });
            queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
            toast.success('Payment processed successfully');
        },
        onError: (error: Error) => {
            toast.error(`Payment failed: ${error.message}`);
        },
    });
}
```

**Key Features:**
- Automatic cache invalidation on mutations
- Toast notifications for user feedback
- Error handling with typed errors
- 5-minute stale time for queries

---

## React Components

### Component Hierarchy

```
CardsPage
├── Statistics Dashboard
│   ├── Total Balance Card
│   ├── Available Credit Card
│   ├── Avg Utilization Card
│   └── Monthly Payments Card
├── High Utilization Alert
└── Tabs
    ├── Credit Cards Tab
    │   └── CardItem[] (grid)
    │       ├── Balance info
    │       ├── Utilization bar
    │       └── Actions menu
    ├── Debit Cards Tab
    │   └── CardItem[] (grid)
    │       └── Linked account info
    └── Payment History Tab
        └── Payment list
            └── Payment details

Dialogs (overlays)
├── AddCardDialog
│   ├── Basic info form
│   ├── Credit card fields (conditional)
│   └── Color picker
└── CardPaymentDialog
    ├── Current balance display
    ├── Quick payment buttons
    ├── Payment method selector
    └── Bank account selector (conditional)
```

### Key Component Patterns

**1. Conditional Rendering**
```typescript
// Show credit-specific fields only for credit cards
{formData.card_type === 'credit' && (
    <>
        <CreditLimitInput />
        <InterestRateInput />
        <BillingDayInput />
    </>
)}
```

**2. Color-Coded UI**
```typescript
// Dynamic utilization bar color
const utilizationColor = 
    utilization > 80 ? '#ef4444' :  // Red
    utilization > 50 ? '#f59e0b' :  // Orange
    card.color;                     // Card color
```

**3. Empty States**
```typescript
{cards.length === 0 ? (
    <EmptyState
        icon={CreditCard}
        title="No cards yet"
        description="Add your first card to get started"
        action={<AddCardButton />}
    />
) : (
    <CardsGrid cards={cards} />
)}
```

---

## State Management

### Zustand Store Methods

```typescript
interface BudgetState {
    // Payment Cards
    paymentCards: PaymentCard[];
    fetchPaymentCards: () => Promise<void>;
    addPaymentCard: (card: Omit<PaymentCard, 'id'>) => Promise<PaymentCard>;
    updatePaymentCard: (id: string, updates: Partial<PaymentCard>) => Promise<void>;
    deletePaymentCard: (id: string) => Promise<void>;
    
    // Card Payments
    cardPayments: CardPayment[];
    fetchCardPayments: () => Promise<void>;
    makeCardPayment: (params: MakeCardPaymentParams) => Promise<void>;
    deleteCardPayment: (id: string) => Promise<void>;
}
```

**Note:** React Query is primary for data fetching; Zustand used for legacy component compatibility.

---

## Performance Optimizations

### 1. Lazy Loading
```typescript
const CardsPage = lazy(() => import('@/pages/CardsPage'));

<Route path="cards" element={
    <Suspense fallback={<DashboardSkeleton />}>
        <CardsPage />
    </Suspense>
} />
```

### 2. Query Caching
- 5-minute staleTime prevents unnecessary refetches
- Automatic invalidation on mutations
- Background refetch on window focus

### 3. Database Indexes
All foreign keys and frequently queried columns indexed:
- `user_id` on all tables (for RLS)
- `card_id` on payments (for joins)
- `payment_date` on payments (for sorting)
- `is_active` on cards (partial index)

### 4. Database Triggers
`calculate_available_credit()` runs at database level, not in application code.

---

## Testing Considerations

### Unit Tests
- Component rendering with different card types
- Utilization calculation logic
- Form validation
- Empty state handling

### Integration Tests
- Card creation flow
- Payment processing with bank account deduction
- Transaction linking
- Query cache invalidation

### E2E Tests
- Complete card management workflow
- Payment processing end-to-end
- Transaction integration
- Multi-card scenarios

---

## Migration Strategy

### Safe Migration Steps

1. **Backup Database**
```bash
pg_dump -h host -U user -d database > backup.sql
```

2. **Run Bank Accounts Migration First**
```bash
psql < migration_add_bank_accounts.sql
```

3. **Run Payment Cards Migration**
```bash
psql < migration_add_payment_cards.sql
```

4. **Verify**
```sql
-- Check tables created
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('payment_cards', 'card_payments');

-- Check triggers
SELECT tgname FROM pg_trigger WHERE tgrelid = 'payment_cards'::regclass;
```

### Rollback Plan

```sql
-- Drop in reverse order
DROP TRIGGER IF EXISTS trg_calculate_available_credit ON payment_cards;
DROP FUNCTION IF EXISTS calculate_available_credit();
DROP FUNCTION IF EXISTS charge_credit_card(UUID, DECIMAL);
DROP FUNCTION IF EXISTS make_card_payment(UUID, DECIMAL, UUID, TEXT, DATE, TEXT);
DROP TABLE IF EXISTS card_payments CASCADE;
DROP TABLE IF EXISTS payment_cards CASCADE;

-- Remove added columns
ALTER TABLE transactions DROP COLUMN IF EXISTS card_id;
ALTER TABLE transactions DROP COLUMN IF EXISTS payment_method;
```

---

## Security Considerations

### 1. PCI Compliance
- **DO NOT** store full card numbers
- Only store last 4 digits
- No CVV/CVC storage
- No expiry month/year in readable format

### 2. Data Protection
- All sensitive data behind RLS
- Functions use `SECURITY DEFINER` carefully
- Input validation in database constraints
- Parameterized queries prevent SQL injection

### 3. Access Control
- User can only access their own cards
- Functions validate user_id matches auth.uid()
- No cross-user data leakage possible

---

## Monitoring & Observability

### Key Metrics to Track

1. **Performance:**
   - Query execution time (should be <100ms)
   - Page load time
   - Mutation success rate

2. **Usage:**
   - Number of active cards per user
   - Average credit utilization
   - Payment frequency
   - Transaction linking rate

3. **Errors:**
   - Failed payment attempts
   - Insufficient balance errors
   - Invalid card errors
   - RPC call failures

### Logging

```typescript
// Add to mutation hooks
onError: (error: Error) => {
    console.error('Payment failed:', {
        error: error.message,
        timestamp: new Date().toISOString(),
        userId: user?.id,
    });
    // Send to monitoring service
}
```

---

## Future Improvements

### Planned Enhancements

1. **Automated Payments:**
   - Scheduled recurring payments
   - Auto-pay from bank account
   - Payment reminders

2. **Analytics:**
   - Spending by card
   - Utilization trends
   - Payment patterns
   - Rewards tracking

3. **Integration:**
   - Plaid/Teller API for balance sync
   - Statement import (OFX/QFX)
   - Credit bureau reporting

4. **UI/UX:**
   - Card image customization
   - Virtual card display
   - Drag-and-drop reordering
   - Quick actions toolbar

---

## API Reference

### Supabase RPC Calls

```typescript
// Make payment
const { data, error } = await supabase.rpc('make_card_payment', {
    p_card_id: string,
    p_payment_amount: number,
    p_from_account_id?: string,
    p_payment_method?: string,
    p_payment_date?: string,
    p_notes?: string
});

// Charge card
const { data, error } = await supabase.rpc('charge_credit_card', {
    p_card_id: string,
    p_amount: number
});
```

### Query Keys

```typescript
const queryKeys = {
    paymentCards: ['paymentCards'],
    cardPayments: ['cardPayments'],
};
```

---

## Troubleshooting Guide

### Common Issues

**1. Trigger not firing**
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trg_calculate_available_credit';

-- Manually recalculate
UPDATE payment_cards 
SET available_credit = credit_limit - COALESCE(current_balance, 0)
WHERE card_type = 'credit';
```

**2. RLS blocking queries**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'payment_cards';

-- Temporarily disable (for debugging only!)
ALTER TABLE payment_cards DISABLE ROW LEVEL SECURITY;
```

**3. Function permission errors**
```sql
-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION make_card_payment TO authenticated;
GRANT EXECUTE ON FUNCTION charge_credit_card TO authenticated;
```

---

## Conclusion

The Payment Cards module provides enterprise-grade card management with:
- ✅ Atomic payment processing
- ✅ Real-time balance tracking
- ✅ Secure RLS implementation
- ✅ Optimized database design
- ✅ Type-safe TypeScript integration
- ✅ React Query caching strategy
- ✅ Comprehensive error handling

**Built with best practices for scalability, security, and maintainability.**

---

**Document Version:** 1.0  
**Last Updated:** October 31, 2025  
**Author:** Development Team
