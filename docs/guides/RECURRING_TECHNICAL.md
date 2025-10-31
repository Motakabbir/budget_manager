# Recurring Transactions - Technical Documentation

## Overview

This document provides comprehensive technical details about the Recurring Transactions module implementation, including database schema, API interactions, React components, hooks, and services.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [TypeScript Types](#typescript-types)
4. [State Management](#state-management)
5. [React Query Hooks](#react-query-hooks)
6. [Services](#services)
7. [Components](#components)
8. [Pages](#pages)
9. [Auto-Processing System](#auto-processing-system)
10. [Frequency Calculations](#frequency-calculations)
11. [Testing](#testing)
12. [Performance Considerations](#performance-considerations)

---

## Architecture

### Technology Stack

- **Frontend**: React 19 with TypeScript 5
- **State Management**: Zustand (global state) + TanStack Query (server state)
- **Database**: Supabase PostgreSQL
- **UI**: Tailwind CSS 4 + shadcn/ui
- **Date Library**: date-fns
- **Icons**: Lucide React
- **Build Tool**: Vite 7

### Module Structure

```
src/
├── components/
│   └── recurring/
│       ├── RecurringCard.tsx              # Display card for recurring transaction
│       ├── AddRecurringDialog.tsx         # Create new recurring form
│       ├── EditRecurringDialog.tsx        # Edit existing recurring form
│       ├── ProcessDueRecurringButton.tsx  # Manual trigger button
│       └── index.ts                       # Barrel export
├── pages/
│   └── RecurringTransactionsPage.tsx      # Main page with tabs & stats
├── lib/
│   ├── hooks/
│   │   ├── use-budget-queries.ts          # React Query hooks
│   │   └── use-recurring-auto-process.ts  # Auto-processing hook
│   ├── services/
│   │   └── recurring-transactions.service.ts # Business logic
│   ├── store/
│   │   └── index.ts                       # Zustand store
│   └── supabase/
│       └── database.types.ts              # Database types
└── App.tsx                                # Route configuration
```

---

## Database Schema

### Table: `recurring_transactions`

Located in: `docs/database/migration_add_recurring.sql`

```sql
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  type transaction_type NOT NULL,
  frequency recurring_frequency NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  next_occurrence DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_end_date CHECK (end_date IS NULL OR end_date >= start_date)
);
```

### Enums

```sql
-- transaction_type (reused from transactions table)
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- recurring_frequency
CREATE TYPE recurring_frequency AS ENUM (
  'daily',
  'weekly',
  'bi-weekly',
  'monthly',
  'quarterly',
  'yearly'
);
```

### Indexes

```sql
-- Performance optimization for queries
CREATE INDEX idx_recurring_user_id ON recurring_transactions(user_id);
CREATE INDEX idx_recurring_next_occurrence ON recurring_transactions(next_occurrence);
CREATE INDEX idx_recurring_is_active ON recurring_transactions(is_active) WHERE is_active = true;
```

### RLS Policies

```sql
-- Users can only see their own recurring transactions
CREATE POLICY "Users can view own recurring"
  ON recurring_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own recurring transactions
CREATE POLICY "Users can insert own recurring"
  ON recurring_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own recurring transactions
CREATE POLICY "Users can update own recurring"
  ON recurring_transactions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own recurring transactions
CREATE POLICY "Users can delete own recurring"
  ON recurring_transactions FOR DELETE
  USING (auth.uid() = user_id);
```

---

## RPC Function: `create_recurring_transaction`

### Purpose
Creates a transaction from a recurring template and updates the next occurrence date.

### SQL Implementation

```sql
CREATE OR REPLACE FUNCTION create_recurring_transaction(recurring_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recurring recurring_transactions%ROWTYPE;
  v_transaction_id UUID;
  v_next_date DATE;
BEGIN
  -- Get the recurring transaction
  SELECT * INTO v_recurring
  FROM recurring_transactions
  WHERE id = recurring_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recurring transaction not found';
  END IF;

  -- Create the transaction
  INSERT INTO transactions (user_id, category_id, amount, description, type, date, recurring_transaction_id)
  VALUES (
    v_recurring.user_id,
    v_recurring.category_id,
    v_recurring.amount,
    v_recurring.description,
    v_recurring.type,
    v_recurring.next_occurrence,
    recurring_id
  )
  RETURNING id INTO v_transaction_id;

  -- Calculate next occurrence based on frequency
  CASE v_recurring.frequency
    WHEN 'daily' THEN v_next_date := v_recurring.next_occurrence + INTERVAL '1 day';
    WHEN 'weekly' THEN v_next_date := v_recurring.next_occurrence + INTERVAL '7 days';
    WHEN 'bi-weekly' THEN v_next_date := v_recurring.next_occurrence + INTERVAL '14 days';
    WHEN 'monthly' THEN v_next_date := v_recurring.next_occurrence + INTERVAL '1 month';
    WHEN 'quarterly' THEN v_next_date := v_recurring.next_occurrence + INTERVAL '3 months';
    WHEN 'yearly' THEN v_next_date := v_recurring.next_occurrence + INTERVAL '1 year';
  END CASE;

  -- Update next_occurrence
  UPDATE recurring_transactions
  SET next_occurrence = v_next_date,
      updated_at = now()
  WHERE id = recurring_id;

  -- Auto-deactivate if past end_date
  IF v_recurring.end_date IS NOT NULL AND v_next_date > v_recurring.end_date THEN
    UPDATE recurring_transactions
    SET is_active = false,
        updated_at = now()
    WHERE id = recurring_id;
  END IF;

  RETURN v_transaction_id;
END;
$$;
```

### Usage Example

```typescript
const { data, error } = await supabase.rpc('create_recurring_transaction', {
  recurring_id: 'uuid-here'
});
```

---

## TypeScript Types

### Location: `src/lib/supabase/database.types.ts`

```typescript
export type RecurringFrequency = 
  | 'daily' 
  | 'weekly' 
  | 'bi-weekly' 
  | 'monthly' 
  | 'quarterly' 
  | 'yearly';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description?: string;
  type: 'income' | 'expense';
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string;
  next_occurrence: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
    type: 'income' | 'expense';
    color: string;
  };
}

export interface CreateRecurringTransactionParams {
  category_id: string;
  amount: number;
  description?: string;
  type: 'income' | 'expense';
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string;
}

export interface UpdateRecurringTransactionParams {
  category_id?: string;
  amount?: number;
  description?: string;
  frequency?: RecurringFrequency;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}
```

---

## State Management

### Zustand Store

**Location**: `src/lib/store/index.ts`

```typescript
interface BudgetStore {
  // State
  recurringTransactions: RecurringTransaction[];

  // Actions
  fetchRecurringTransactions: () => Promise<void>;
  addRecurringTransaction: (recurring: RecurringTransaction) => void;
  updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => void;
  deleteRecurringTransaction: (id: string) => void;
  toggleRecurringTransaction: (id: string, isActive: boolean) => void;
  createFromRecurring: (recurringId: string) => Promise<string | null>;
}

// Implementation
const useBudgetStore = create<BudgetStore>((set, get) => ({
  recurringTransactions: [],

  fetchRecurringTransactions: async () => {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*, categories(*)')
      .order('next_occurrence', { ascending: true });
    
    if (!error && data) {
      set({ recurringTransactions: data });
    }
  },

  addRecurringTransaction: (recurring) => {
    set((state) => ({
      recurringTransactions: [...state.recurringTransactions, recurring]
    }));
  },

  updateRecurringTransaction: (id, updates) => {
    set((state) => ({
      recurringTransactions: state.recurringTransactions.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      )
    }));
  },

  deleteRecurringTransaction: (id) => {
    set((state) => ({
      recurringTransactions: state.recurringTransactions.filter((r) => r.id !== id)
    }));
  },

  toggleRecurringTransaction: (id, isActive) => {
    set((state) => ({
      recurringTransactions: state.recurringTransactions.map((r) =>
        r.id === id ? { ...r, is_active: isActive } : r
      )
    }));
  },

  createFromRecurring: async (recurringId) => {
    const { data, error } = await supabase.rpc('create_recurring_transaction', {
      recurring_id: recurringId
    });
    
    if (error) {
      console.error('Error creating from recurring:', error);
      return null;
    }
    
    await get().fetchRecurringTransactions();
    return data;
  }
}));
```

---

## React Query Hooks

### Location: `src/lib/hooks/use-budget-queries.ts`

#### 1. `useRecurringTransactions()`

Fetches all recurring transactions with categories.

```typescript
export const useRecurringTransactions = () => {
  const { data: user } = useUser();
  const addRecurringTransaction = useBudgetStore((state) => state.addRecurringTransaction);

  return useQuery({
    queryKey: ['recurringTransactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*, categories(*)')
        .order('next_occurrence', { ascending: true });

      if (error) throw error;
      return data as RecurringTransaction[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

#### 2. `useCreateRecurring()`

Creates a new recurring transaction.

```typescript
export const useCreateRecurring = () => {
  const queryClient = useQueryClient();
  const addRecurringTransaction = useBudgetStore((state) => state.addRecurringTransaction);

  return useMutation({
    mutationFn: async (params: CreateRecurringTransactionParams) => {
      // Calculate next_occurrence from start_date and frequency
      const nextOccurrence = calculateNextOccurrence(
        params.start_date,
        params.frequency
      );

      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert([{ ...params, next_occurrence: nextOccurrence }])
        .select('*, categories(*)')
        .single();

      if (error) throw error;
      return data as RecurringTransaction;
    },
    onSuccess: (data) => {
      addRecurringTransaction(data);
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      toast.success('Recurring transaction created');
    },
    onError: (error) => {
      console.error('Error creating recurring:', error);
      toast.error('Failed to create recurring transaction');
    },
  });
};
```

#### 3. `useUpdateRecurring()`

Updates an existing recurring transaction.

```typescript
export const useUpdateRecurring = () => {
  const queryClient = useQueryClient();
  const updateRecurringTransaction = useBudgetStore(
    (state) => state.updateRecurringTransaction
  );

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateRecurringTransactionParams;
    }) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id)
        .select('*, categories(*)')
        .single();

      if (error) throw error;
      return data as RecurringTransaction;
    },
    onSuccess: (data) => {
      updateRecurringTransaction(data.id, data);
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      toast.success('Recurring transaction updated');
    },
    onError: (error) => {
      console.error('Error updating recurring:', error);
      toast.error('Failed to update recurring transaction');
    },
  });
};
```

#### 4. `useDeleteRecurring()`

Deletes a recurring transaction.

```typescript
export const useDeleteRecurring = () => {
  const queryClient = useQueryClient();
  const deleteRecurringTransaction = useBudgetStore(
    (state) => state.deleteRecurringTransaction
  );

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      deleteRecurringTransaction(id);
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      toast.success('Recurring transaction deleted');
    },
    onError: (error) => {
      console.error('Error deleting recurring:', error);
      toast.error('Failed to delete recurring transaction');
    },
  });
};
```

#### 5. `useToggleRecurring()`

Activates or deactivates a recurring transaction.

```typescript
export const useToggleRecurring = () => {
  const queryClient = useQueryClient();
  const toggleRecurringTransaction = useBudgetStore(
    (state) => state.toggleRecurringTransaction
  );

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update({ is_active: isActive })
        .eq('id', id)
        .select('*, categories(*)')
        .single();

      if (error) throw error;
      return data as RecurringTransaction;
    },
    onSuccess: (data) => {
      toggleRecurringTransaction(data.id, data.is_active);
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      toast.success(
        data.is_active
          ? 'Recurring transaction activated'
          : 'Recurring transaction deactivated'
      );
    },
    onError: (error) => {
      console.error('Error toggling recurring:', error);
      toast.error('Failed to toggle recurring transaction');
    },
  });
};
```

#### 6. `useCreateFromRecurring()`

Executes the RPC function to create a transaction from a recurring template.

```typescript
export const useCreateFromRecurring = () => {
  const queryClient = useQueryClient();
  const createFromRecurring = useBudgetStore((state) => state.createFromRecurring);

  return useMutation({
    mutationFn: async (recurringId: string) => {
      const transactionId = await createFromRecurring(recurringId);
      if (!transactionId) throw new Error('Failed to create transaction');
      return transactionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction created from recurring');
    },
    onError: (error) => {
      console.error('Error creating from recurring:', error);
      toast.error('Failed to create transaction');
    },
  });
};
```

---

## Services

### RecurringTransactionsService

**Location**: `src/lib/services/recurring-transactions.service.ts`

Handles business logic for recurring transaction processing.

```typescript
export class RecurringTransactionsService {
  /**
   * Process all due recurring transactions
   * Creates transactions for recurring where next_occurrence <= today
   */
  static async processDueRecurring(): Promise<{
    processed: number;
    errors: string[];
  }> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // Fetch all active recurring transactions that are due
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: dueRecurring, error: fetchError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('is_active', true)
      .lte('next_occurrence', today);

    if (fetchError) {
      console.error('Error fetching due recurring:', fetchError);
      return { processed: 0, errors: [fetchError.message] };
    }

    if (!dueRecurring || dueRecurring.length === 0) {
      return { processed: 0, errors: [] };
    }

    // Process each recurring transaction
    const errors: string[] = [];
    let processed = 0;

    for (const recurring of dueRecurring) {
      try {
        const { error: rpcError } = await supabase.rpc(
          'create_recurring_transaction',
          { recurring_id: recurring.id }
        );

        if (rpcError) {
          errors.push(`Failed to process ${recurring.description}: ${rpcError.message}`);
        } else {
          processed++;
        }
      } catch (err) {
        errors.push(`Error processing ${recurring.description}: ${err}`);
      }
    }

    console.log(`Processed ${processed} recurring transactions`);
    if (errors.length > 0) {
      console.error('Errors during processing:', errors);
    }

    return { processed, errors };
  }

  /**
   * Get upcoming recurring transactions for the next N days
   */
  static async getUpcoming(days: number = 7): Promise<RecurringTransaction[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const startDate = format(new Date(), 'yyyy-MM-dd');
    const endDate = format(addDays(new Date(), days), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*, categories(*)')
      .eq('is_active', true)
      .gte('next_occurrence', startDate)
      .lte('next_occurrence', endDate)
      .order('next_occurrence', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming recurring:', error);
      return [];
    }

    return data as RecurringTransaction[];
  }

  /**
   * Get statistics about recurring transactions
   */
  static async getStats(): Promise<{
    activeCount: number;
    inactiveCount: number;
    dueCount: number;
    totalMonthlyIncome: number;
    totalMonthlyExpense: number;
  }> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { data: recurring, error } = await supabase
      .from('recurring_transactions')
      .select('*');

    if (error) {
      console.error('Error fetching recurring stats:', error);
      return {
        activeCount: 0,
        inactiveCount: 0,
        dueCount: 0,
        totalMonthlyIncome: 0,
        totalMonthlyExpense: 0,
      };
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const active = recurring.filter((r) => r.is_active);
    const inactive = recurring.filter((r) => !r.is_active);
    const due = active.filter((r) => r.next_occurrence <= today);

    // Calculate monthly totals using frequency multipliers
    const monthlyIncome = active
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + r.amount * this.getMonthlyMultiplier(r.frequency), 0);

    const monthlyExpense = active
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount * this.getMonthlyMultiplier(r.frequency), 0);

    return {
      activeCount: active.length,
      inactiveCount: inactive.length,
      dueCount: due.length,
      totalMonthlyIncome: monthlyIncome,
      totalMonthlyExpense: monthlyExpense,
    };
  }

  /**
   * Get multiplier to convert frequency to monthly equivalent
   */
  private static getMonthlyMultiplier(frequency: RecurringFrequency): number {
    const multipliers: Record<RecurringFrequency, number> = {
      daily: 30,
      weekly: 4.33,
      'bi-weekly': 2.17,
      monthly: 1,
      quarterly: 0.33,
      yearly: 0.08,
    };
    return multipliers[frequency];
  }
}
```

---

## Auto-Processing System

### Hook: `useRecurringAutoProcess`

**Location**: `src/lib/hooks/use-recurring-auto-process.ts`

```typescript
export const useRecurringAutoProcess = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const processRecurring = async () => {
      try {
        const result = await RecurringTransactionsService.processDueRecurring();
        
        if (result.processed > 0) {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          
          // Silent on auto-process (no toast)
        }

        if (result.errors.length > 0) {
          console.error('Auto-processing errors:', result.errors);
        }
      } catch (error) {
        console.error('Auto-processing failed:', error);
      }
    };

    // Run after 2 seconds to allow page to load
    const timer = setTimeout(processRecurring, 2000);

    return () => clearTimeout(timer);
  }, [queryClient]);

  // Return manual trigger function
  const processRecurring = async (silent: boolean = false) => {
    try {
      const result = await RecurringTransactionsService.processDueRecurring();
      
      if (result.processed > 0) {
        queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        
        if (!silent) {
          toast.success(`${result.processed} recurring transactions created`);
        }
      } else if (!silent) {
        toast.info('No due recurring transactions');
      }

      if (result.errors.length > 0 && !silent) {
        toast.error(`Errors: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Processing failed:', error);
      if (!silent) {
        toast.error('Failed to process recurring transactions');
      }
    }
  };

  return { processRecurring };
};

export const useRecurringDueCount = () => {
  const { data: recurring } = useRecurringTransactions();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return (
    recurring?.filter(
      (r) => r.is_active && r.next_occurrence <= today
    ).length || 0
  );
};
```

### Integration Points

1. **DashboardLayout.tsx**: Auto-runs on app load
   ```typescript
   useRecurringAutoProcess(); // Runs once on mount
   ```

2. **ProcessDueRecurringButton.tsx**: Manual trigger
   ```typescript
   const { processRecurring } = useRecurringAutoProcess();
   
   <Button onClick={() => processRecurring(false)}>
     Process Due Now
   </Button>
   ```

---

## Frequency Calculations

### Next Occurrence Logic

**Location**: `src/lib/utils/date-calculations.ts`

```typescript
import { addDays, addWeeks, addMonths, addQuarters, addYears, format } from 'date-fns';

export const calculateNextOccurrence = (
  startDate: string,
  frequency: RecurringFrequency
): string => {
  const date = new Date(startDate);

  switch (frequency) {
    case 'daily':
      return format(addDays(date, 1), 'yyyy-MM-dd');
    case 'weekly':
      return format(addWeeks(date, 1), 'yyyy-MM-dd');
    case 'bi-weekly':
      return format(addWeeks(date, 2), 'yyyy-MM-dd');
    case 'monthly':
      return format(addMonths(date, 1), 'yyyy-MM-dd');
    case 'quarterly':
      return format(addQuarters(date, 1), 'yyyy-MM-dd');
    case 'yearly':
      return format(addYears(date, 1), 'yyyy-MM-dd');
    default:
      return startDate;
  }
};

export const getUpcomingOccurrences = (
  startDate: string,
  frequency: RecurringFrequency,
  count: number = 3
): string[] => {
  const occurrences: string[] = [];
  let currentDate = startDate;

  for (let i = 0; i < count; i++) {
    currentDate = calculateNextOccurrence(currentDate, frequency);
    occurrences.push(currentDate);
  }

  return occurrences;
};
```

### Monthly Multipliers

Used for statistics calculations:

| Frequency | Multiplier | Calculation |
|-----------|------------|-------------|
| Daily | 30 | Assumes 30 days/month |
| Weekly | 4.33 | 52 weeks / 12 months |
| Bi-weekly | 2.17 | 26 bi-weeks / 12 months |
| Monthly | 1 | Exact match |
| Quarterly | 0.33 | 4 quarters / 12 months |
| Yearly | 0.08 | 1 year / 12 months |

---

## Testing

### Unit Tests

**Location**: `src/components/recurring/__tests__/`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecurringCard } from '../RecurringCard';

describe('RecurringCard', () => {
  const mockRecurring = {
    id: '1',
    amount: 1500,
    type: 'expense',
    frequency: 'monthly',
    next_occurrence: '2025-11-01',
    is_active: true,
    categories: { name: 'Rent', color: '#FF5733' },
  };

  it('renders recurring details correctly', () => {
    render(<RecurringCard recurring={mockRecurring} />);
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
  });

  it('shows correct frequency icon', () => {
    render(<RecurringCard recurring={mockRecurring} />);
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
describe('RecurringTransactionsPage', () => {
  it('displays statistics correctly', async () => {
    render(<RecurringTransactionsPage />);
    await screen.findByText('Monthly Recurring Income');
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
  });

  it('switches between tabs', async () => {
    render(<RecurringTransactionsPage />);
    fireEvent.click(screen.getByText('Inactive'));
    expect(screen.getByText('No inactive recurring')).toBeInTheDocument();
  });
});
```

---

## Performance Considerations

### 1. Query Optimization

- **Indexes**: `user_id`, `next_occurrence`, `is_active` for fast lookups
- **Stale Time**: 5-minute cache on React Query to reduce API calls
- **Select Optimization**: Only fetch necessary columns with `.select('*, categories(id, name, color)')`

### 2. Auto-Processing

- **Debounce**: 2-second delay on app load to avoid blocking UI
- **Batch Processing**: RPC function processes one at a time but efficiently
- **Error Handling**: Collects errors without stopping entire batch

### 3. Component Optimization

- **Lazy Loading**: RecurringTransactionsPage uses `React.lazy()`
- **Memoization**: Uses `useMemo` for expensive calculations (stats, filters)
- **Virtualization**: Grid layout auto-handles large lists efficiently

### 4. Database Performance

- **RLS Policies**: Efficient row-level filtering at database level
- **Partial Index**: `is_active` index only on active=true rows
- **Connection Pooling**: Supabase handles connection management

---

## Error Handling

### Client-Side

```typescript
try {
  await createRecurring(params);
} catch (error) {
  if (error.code === '23505') {
    toast.error('Duplicate recurring transaction');
  } else if (error.code === '23503') {
    toast.error('Invalid category selected');
  } else {
    toast.error('Failed to create recurring transaction');
  }
  console.error('Create recurring error:', error);
}
```

### Server-Side (RPC Function)

```sql
BEGIN
  -- Validation
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recurring transaction not found';
  END IF;

  -- Transaction (automatic rollback on error)
  INSERT INTO transactions ...;
  UPDATE recurring_transactions ...;

  RETURN v_transaction_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create transaction: %', SQLERRM;
END;
```

---

## Security Considerations

1. **RLS Policies**: All database access filtered by `auth.uid()`
2. **RPC Security**: `SECURITY DEFINER` with user validation
3. **Input Validation**: Amount > 0, end_date >= start_date constraints
4. **XSS Protection**: React auto-escapes user input
5. **CSRF Protection**: Supabase handles token management

---

## Future Enhancements

1. **Backend Cron Job**: Move auto-processing to server-side scheduled task
2. **Notification System**: Email/SMS alerts before recurring transactions
3. **Skip Occurrences**: Allow users to skip specific dates
4. **Transaction History**: Direct link from recurring to created transactions
5. **Bulk Operations**: Activate/deactivate multiple recurring at once
6. **Export/Import**: CSV export for recurring templates
7. **Analytics**: Trends and forecasting based on recurring data

---

## Troubleshooting

### Common Issues

**Issue**: Transactions not created automatically  
**Solution**: Check `is_active=true`, `next_occurrence<=today`, and user is logged in

**Issue**: RPC function fails  
**Solution**: Verify category exists, user owns recurring, amount > 0

**Issue**: Incorrect next occurrence  
**Solution**: Verify frequency enum matches, check date calculations with date-fns

---

## API Reference

### Supabase Queries

```typescript
// Fetch all recurring
supabase.from('recurring_transactions').select('*, categories(*)');

// Create recurring
supabase.from('recurring_transactions').insert([data]);

// Update recurring
supabase.from('recurring_transactions').update(updates).eq('id', id);

// Delete recurring
supabase.from('recurring_transactions').delete().eq('id', id);

// Execute RPC
supabase.rpc('create_recurring_transaction', { recurring_id: id });
```

---

**Last Updated**: October 31, 2025  
**Version**: 1.0.0  
**Module**: Recurring Transactions
