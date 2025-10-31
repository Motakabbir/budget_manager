# Budgets - Technical Documentation

## Overview

The Budgets module provides comprehensive spending limit tracking with real-time monitoring and automatic alerting. Built with React Query, Zustand, and Supabase, it offers robust budget management for expense categories with monthly and yearly periods.

---

## Architecture

### Technology Stack

- **Frontend**: React 19, TypeScript 5
- **State Management**: Zustand (global), React Query (server state)
- **Database**: Supabase PostgreSQL with Row Level Security
- **UI**: Tailwind CSS 4, shadcn/ui components
- **Notifications**: sonner (toast alerts)
- **Date Handling**: date-fns
- **Routing**: React Router 6

### Module Structure

```
src/
├── lib/
│   ├── hooks/
│   │   ├── use-budget-queries.ts      # 6 React Query hooks
│   │   └── use-budget-alerts.ts       # Alert monitoring system
│   ├── store/
│   │   └── index.ts                   # Zustand budget methods
│   └── supabase/
│       └── database.types.ts          # TypeScript types
├── components/
│   ├── budgets/
│   │   ├── BudgetCard.tsx             # Budget display card
│   │   ├── AddBudgetDialog.tsx        # Creation form
│   │   ├── EditBudgetDialog.tsx       # Edit form
│   │   ├── BudgetAlertBadge.tsx       # Sidebar badge
│   │   └── index.ts                   # Barrel exports
│   └── dashboard/
│       └── BudgetAlertsWidget.tsx     # Dashboard widget
└── pages/
    └── BudgetsPage.tsx                # Main budgets page
```

---

## Database Schema

### Table: `category_budgets`

```sql
CREATE TABLE category_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    period TEXT NOT NULL CHECK (period IN ('monthly', 'yearly')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category_id, period)
);
```

### Constraints

**Primary Key:**
- `id`: UUID, auto-generated

**Foreign Keys:**
- `user_id`: Links to auth.users
- `category_id`: Links to categories table

**Unique Constraint:**
- `(user_id, category_id, period)`: One budget per category per period per user

**Check Constraints:**
- `amount > 0`: Budget must be positive
- `period IN ('monthly', 'yearly')`: Only two valid periods

### Indexes

```sql
CREATE INDEX idx_category_budgets_user_id ON category_budgets(user_id);
CREATE INDEX idx_category_budgets_category_id ON category_budgets(category_id);
```

**Purpose:**
- Fast lookups by user (main query)
- Fast lookups by category (spending calculation)

### Row Level Security (RLS)

**Policies:**

```sql
-- SELECT: Users can view their own budgets
CREATE POLICY "Users can view their own budgets"
ON category_budgets FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Users can create their own budgets
CREATE POLICY "Users can insert their own budgets"
ON category_budgets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own budgets
CREATE POLICY "Users can update their own budgets"
ON category_budgets FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: Users can delete their own budgets
CREATE POLICY "Users can delete their own budgets"
ON category_budgets FOR DELETE
USING (auth.uid() = user_id);
```

---

## TypeScript Types

### Core Types

```typescript
// Period enum
export type BudgetPeriod = 'monthly' | 'yearly';

// Base budget from database
export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: BudgetPeriod;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
    type: 'income' | 'expense';
    color: string;
  };
}

// Budget with calculated spending
export interface BudgetWithSpending extends Budget {
  spent: number;        // Total spent in period
  remaining: number;    // Budget - spent
  percentage: number;   // (spent / budget) * 100
  status: 'safe' | 'warning' | 'exceeded';
}

// Create budget parameters
export interface CreateBudgetParams {
  category_id: string;
  amount: number;
  period: BudgetPeriod;
}

// Update budget parameters
export interface UpdateBudgetParams {
  amount?: number;
  period?: BudgetPeriod;
}
```

### Status Thresholds

```typescript
// Status calculation logic
const calculateStatus = (percentage: number): BudgetStatus => {
  if (percentage >= 100) return 'exceeded';
  if (percentage >= 80) return 'warning';
  return 'safe';
};
```

**Thresholds:**
- **Safe**: 0% - 79.99%
- **Warning**: 80% - 99.99%
- **Exceeded**: 100%+

---

## React Query Hooks

### Location: `src/lib/hooks/use-budget-queries.ts`

### 1. useBudgets()

**Purpose**: Fetch all budgets with category relationships

```typescript
export const useBudgets = () => {
  return useQuery({
    queryKey: queryKeys.budgets,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_budgets')
        .select('*, categories(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Budget[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

**Returns:**
- `data`: Array of Budget objects with categories
- `isLoading`: Boolean loading state
- `error`: Error object if failed
- `refetch`: Manual refetch function

**Cache**: 5 minutes

### 2. useCreateBudget()

**Purpose**: Create a new budget

```typescript
export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: CreateBudgetParams) => {
      const { data, error } = await supabase
        .from('category_budgets')
        .insert({
          category_id: params.category_id,
          amount: params.amount,
          period: params.period,
        })
        .select('*, categories(*)')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
      toast.success('Budget created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create budget');
    },
  });
};
```

**Parameters:**
- `category_id`: UUID of expense category
- `amount`: Positive decimal number
- `period`: 'monthly' or 'yearly'

**Side Effects:**
- Invalidates budgets cache
- Shows success/error toast

### 3. useUpdateBudget()

**Purpose**: Update existing budget

```typescript
export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, params }: { id: string; params: UpdateBudgetParams }) => {
      const { data, error } = await supabase
        .from('category_budgets')
        .update({
          ...params,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*, categories(*)')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
      toast.success('Budget updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update budget');
    },
  });
};
```

**Parameters:**
- `id`: Budget UUID
- `params`: Object with `amount` and/or `period`

**Side Effects:**
- Updates `updated_at` timestamp
- Invalidates budgets cache
- Shows success/error toast

### 4. useDeleteBudget()

**Purpose**: Delete a budget

```typescript
export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('category_budgets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
      toast.success('Budget deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete budget');
    },
  });
};
```

**Parameters:**
- `id`: Budget UUID to delete

**Side Effects:**
- Removes budget from database
- Invalidates budgets cache
- Shows success/error toast

### 5. useBudgetSpending()

**Purpose**: Calculate spending for a specific budget

```typescript
export const useBudgetSpending = (categoryId: string, period: BudgetPeriod) => {
  return useQuery({
    queryKey: [...queryKeys.budgets, 'spending', categoryId, period],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (period === 'monthly') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      } else {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('category_id', categoryId)
        .eq('type', 'expense')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      if (error) throw error;
      
      const total = data.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      return total;
    },
    enabled: !!categoryId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
```

**Parameters:**
- `categoryId`: Category to calculate spending for
- `period`: 'monthly' or 'yearly'

**Returns:**
- `data`: Total spending amount (number)
- `isLoading`: Boolean loading state
- `error`: Error object if failed

**Logic:**
- Monthly: Current month (1st to last day)
- Yearly: Current year (Jan 1 to Dec 31)
- Sums absolute values of expense transactions

**Cache**: 1 minute (frequently updated)

### 6. useBudgetsWithSpending()

**Purpose**: Combine all budgets with real-time spending calculations

```typescript
export const useBudgetsWithSpending = () => {
  const { data: budgets, isLoading: budgetsLoading } = useBudgets();
  
  const budgetsWithSpending = budgets?.map(budget => {
    const { data: spending = 0 } = useBudgetSpending(
      budget.category_id,
      budget.period
    );
    
    const spent = spending;
    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * 100;
    const status = percentage >= 100 ? 'exceeded' 
                  : percentage >= 80 ? 'warning' 
                  : 'safe';
    
    return {
      ...budget,
      spent,
      remaining,
      percentage,
      status,
    } as BudgetWithSpending;
  }) || [];
  
  return {
    data: budgetsWithSpending,
    isLoading: budgetsLoading,
  };
};
```

**Returns:**
- `data`: Array of BudgetWithSpending objects
- `isLoading`: Boolean loading state

**Calculation:**
- Fetches all budgets
- Runs useBudgetSpending for each budget
- Calculates remaining, percentage, status
- Returns enriched budget objects

**Performance**: Uses React Query cache for efficiency

---

## Budget Alert System

### Location: `src/lib/hooks/use-budget-alerts.ts`

### 1. useBudgetAlerts()

**Purpose**: Monitor budgets and show toast notifications

```typescript
export const useBudgetAlerts = () => {
  const { data: budgets, isLoading } = useBudgetsWithSpending();

  useEffect(() => {
    if (isLoading || !budgets) return;

    const budgetsNeedingAlert = budgets.filter(
      b => b.status === 'warning' || b.status === 'exceeded'
    );

    if (budgetsNeedingAlert.length === 0) return;

    const shownAlerts = getShownAlerts();
    const newAlerts: string[] = [];

    budgetsNeedingAlert.forEach(budget => {
      const alertKey = generateAlertKey(budget);
      if (!shownAlerts.includes(alertKey)) {
        newAlerts.push(alertKey);
      }
    });

    if (newAlerts.length > 0) {
      showBudgetAlerts(budgetsNeedingAlert.filter(budget => {
        const alertKey = generateAlertKey(budget);
        return newAlerts.includes(alertKey);
      }));
      markAlertsAsShown(newAlerts);
    }
  }, [budgets, isLoading]);
};
```

**Behavior:**
- Runs on mount and when budgets data changes
- Filters for warning/exceeded budgets
- Checks localStorage for already-shown alerts
- Shows toast only for NEW alerts
- Marks alerts as shown with timestamp

**Alert Deduplication:**
- Generates unique key: `${budgetId}-${status}-${Math.floor(percentage/10)}`
- Groups by 10% brackets (80-89%, 90-99%, 100-109%, etc.)
- Prevents repeated alerts for same threshold

**localStorage Key**: `budget-alerts-shown`

### 2. useBudgetAlertsCount()

**Purpose**: Get count of budgets needing attention

```typescript
export const useBudgetAlertsCount = () => {
  const { data: budgets } = useBudgetsWithSpending();

  const exceededCount = budgets.filter(b => b.status === 'exceeded').length;
  const warningCount = budgets.filter(b => b.status === 'warning').length;
  const totalCount = exceededCount + warningCount;

  return { exceededCount, warningCount, totalCount };
};
```

**Returns:**
- `exceededCount`: Number of budgets over 100%
- `warningCount`: Number of budgets at 80-100%
- `totalCount`: Sum of exceeded + warning

**Usage**: Sidebar badge, statistics cards

### 3. useBudgetsNeedingAttention()

**Purpose**: Get filtered list of problem budgets

```typescript
export const useBudgetsNeedingAttention = () => {
  const { data: budgets, isLoading } = useBudgetsWithSpending();

  const budgetsNeedingAttention = budgets.filter(
    b => b.status === 'warning' || b.status === 'exceeded'
  );

  return { data: budgetsNeedingAttention, isLoading };
};
```

**Returns:**
- `data`: Array of BudgetWithSpending (warning or exceeded only)
- `isLoading`: Boolean loading state

**Usage**: Dashboard widget, alert banners

### Helper Functions

#### showBudgetAlerts()

```typescript
const showBudgetAlerts = (budgets: BudgetWithSpending[]) => {
  const exceeded = budgets.filter(b => b.status === 'exceeded');
  const warning = budgets.filter(b => b.status === 'warning');

  exceeded.forEach(budget => {
    const overspent = budget.spent - budget.amount;
    toast.error(
      `Budget Exceeded: ${budget.categories?.name}`,
      {
        description: `You've overspent by $${overspent.toFixed(2)}`,
        duration: 8000,
      }
    );
  });

  warning.forEach(budget => {
    toast.warning(
      `Budget Warning: ${budget.categories?.name}`,
      {
        description: `${budget.percentage.toFixed(0)}% used. $${budget.remaining.toFixed(2)} remaining.`,
        duration: 6000,
      }
    );
  });
};
```

**Toast Types:**
- Exceeded: Error toast, 8-second duration
- Warning: Warning toast, 6-second duration

#### generateAlertKey()

```typescript
const generateAlertKey = (budget: BudgetWithSpending): string => {
  const percentageBracket = Math.floor(budget.percentage / 10);
  return `${budget.id}-${budget.status}-${percentageBracket}`;
};
```

**Example Keys:**
- `abc123-warning-8` (80-89%)
- `abc123-warning-9` (90-99%)
- `abc123-exceeded-10` (100-109%)
- `abc123-exceeded-15` (150-159%)

#### getShownAlerts()

```typescript
const getShownAlerts = (): string[] => {
  const stored = localStorage.getItem('budget-alerts-shown');
  if (!stored) return [];

  const alerts = JSON.parse(stored);
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const validAlerts = Object.entries(alerts)
    .filter(([_, timestamp]) => {
      return (now - (timestamp as number)) < oneDayMs;
    })
    .map(([key]) => key);

  if (validAlerts.length !== Object.keys(alerts).length) {
    const newAlerts = Object.fromEntries(
      validAlerts.map(key => [key, alerts[key]])
    );
    localStorage.setItem('budget-alerts-shown', JSON.stringify(newAlerts));
  }

  return validAlerts;
};
```

**Logic:**
- Retrieves from localStorage
- Filters entries older than 24 hours
- Cleans up expired entries
- Returns array of valid alert keys

#### markAlertsAsShown()

```typescript
const markAlertsAsShown = (alertKeys: string[]) => {
  const stored = localStorage.getItem('budget-alerts-shown');
  const alerts = stored ? JSON.parse(stored) : {};
  const now = Date.now();

  alertKeys.forEach(key => {
    alerts[key] = now;
  });

  localStorage.setItem('budget-alerts-shown', JSON.stringify(alerts));
};
```

**Logic:**
- Loads existing alerts
- Adds new alert keys with current timestamp
- Saves back to localStorage

#### clearBudgetAlerts() (Exported)

```typescript
export const clearBudgetAlerts = () => {
  localStorage.removeItem('budget-alerts-shown');
};
```

**Purpose**: Manual reset for testing or troubleshooting

---

## UI Components

### 1. BudgetCard

**Location**: `src/components/budgets/BudgetCard.tsx`  
**Lines**: 170

**Props:**
```typescript
interface BudgetCardProps {
  budget: BudgetWithSpending;
  onEdit: (budget: BudgetWithSpending) => void;
  onDelete: (id: string) => void;
}
```

**Features:**
- Color-coded border (green/yellow/red)
- Category name with color dot
- Period badge
- Status badge
- 3-column amounts (Budget, Spent, Remaining)
- Progress bar with percentage
- Alert messages (contextual)
- Action menu (Edit, Delete with confirmation)

**Styling Logic:**
```typescript
const borderColor = 
  status === 'exceeded' ? 'border-l-red-500' :
  status === 'warning' ? 'border-l-yellow-500' :
  'border-l-green-500';

const progressColor =
  status === 'exceeded' ? 'bg-red-500' :
  status === 'warning' ? 'bg-yellow-500' :
  'bg-green-500';
```

### 2. AddBudgetDialog

**Location**: `src/components/budgets/AddBudgetDialog.tsx`  
**Lines**: 220

**Props:**
```typescript
interface AddBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Features:**
- Category selector (expense categories only)
- Amount input with validation
- Period selector (radio group)
- Live preview section
- Form validation
- Create button with loading state

**Validation:**
```typescript
const isValid = selectedCategory && amount > 0;
```

### 3. EditBudgetDialog

**Location**: `src/components/budgets/EditBudgetDialog.tsx`  
**Lines**: 195

**Props:**
```typescript
interface EditBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: BudgetWithSpending | null;
}
```

**Features:**
- Pre-populated form from budget prop
- Read-only category display
- Current spending info section
- Amount and period editors
- Save/Cancel buttons

**Data Flow:**
```typescript
useEffect(() => {
  if (budget) {
    setAmount(budget.amount);
    setPeriod(budget.period);
  }
}, [budget]);
```

### 4. BudgetAlertBadge

**Location**: `src/components/budgets/BudgetAlertBadge.tsx`  
**Lines**: 20

**Props:** None (uses hook internally)

**Features:**
- Shows count from useBudgetAlertsCount()
- Displays "9+" if count > 9
- Returns null if totalCount === 0
- Styled as small red badge

**Usage:**
```tsx
{item.name === 'Budgets' && <BudgetAlertBadge />}
```

### 5. BudgetAlertsWidget

**Location**: `src/components/dashboard/BudgetAlertsWidget.tsx`  
**Lines**: 125

**Props:** None (uses hook internally)

**Features:**
- Success state: Green icon, positive message
- Alert state: Orange border, list of problems
- Shows up to 3 budgets with progress bars
- "+ X more" indicator
- "View All Budgets" button

**Rendering Logic:**
```typescript
if (budgetsNeedingAttention.length === 0) {
  return <SuccessState />;
}

const displayedBudgets = budgetsNeedingAttention.slice(0, 3);
const remainingCount = budgetsNeedingAttention.length - 3;

return <AlertState budgets={displayedBudgets} remaining={remainingCount} />;
```

---

## Pages

### BudgetsPage

**Location**: `src/pages/BudgetsPage.tsx`  
**Lines**: 370

**Features:**
- 4 statistics cards
- Alert banners (exceeded, warning)
- 4 tabs (Monthly, Yearly, Exceeded, Warning)
- Grid layout (responsive)
- Edit/Delete handlers
- Empty states with CTAs

**Statistics Calculation:**
```typescript
const stats = useMemo(() => {
  if (!budgets) return null;
  
  const monthlyBudgets = budgets.filter(b => b.period === 'monthly');
  const totalBudget = monthlyBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = monthlyBudgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  
  const exceededCount = budgets.filter(b => b.status === 'exceeded').length;
  const warningCount = budgets.filter(b => b.status === 'warning').length;
  const safeCount = budgets.filter(b => b.status === 'safe').length;
  
  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    spentPercentage: (totalSpent / totalBudget) * 100,
    exceededCount,
    warningCount,
    safeCount,
  };
}, [budgets]);
```

**Tab Filtering:**
```typescript
const filteredBudgets = useMemo(() => {
  if (!budgets) return [];
  
  switch (activeTab) {
    case 'monthly':
      return budgets.filter(b => b.period === 'monthly');
    case 'yearly':
      return budgets.filter(b => b.period === 'yearly');
    case 'exceeded':
      return budgets.filter(b => b.status === 'exceeded');
    case 'warning':
      return budgets.filter(b => b.status === 'warning');
    default:
      return budgets;
  }
}, [budgets, activeTab]);
```

---

## Integration Points

### DashboardLayout

**Location**: `src/pages/DashboardLayout.tsx`

**Integration:**
```typescript
// Monitor budgets and show alerts
useBudgetAlerts();
```

**Purpose**: Automatic alert checking on app load

### Sidebar

**Location**: `src/components/sidebar.tsx`

**Integration:**
```tsx
import { BudgetAlertBadge } from '@/components/budgets';

// In navigation items
<Icon className="h-5 w-5 shrink-0" />
<span>{item.name}</span>
{item.name === 'Budgets' && <BudgetAlertBadge />}
```

**Purpose**: Visual indicator of budget issues

### App Routing

**Location**: `src/App.tsx`

```tsx
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));

// Routes
<Route
  path="/budgets"
  element={
    <Suspense fallback={<div>Loading...</div>}>
      <BudgetsPage />
    </Suspense>
  }
/>
```

**Position**: After /recurring, before /income

---

## Performance Considerations

### React Query Caching

**Strategy:**
- Budgets list: 5-minute stale time
- Spending calculation: 1-minute stale time
- Background refetch on window focus
- Automatic invalidation on mutations

**Benefits:**
- Reduced database queries
- Fast navigation between pages
- Real-time updates when needed

### Memoization

**Usage:**
```typescript
const stats = useMemo(() => { /* ... */ }, [budgets]);
const filteredBudgets = useMemo(() => { /* ... */ }, [budgets, activeTab]);
```

**Benefits:**
- Prevents unnecessary recalculations
- Optimizes rendering performance

### Lazy Loading

**Implementation:**
```typescript
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
```

**Benefits:**
- Smaller initial bundle size
- Faster app load time
- Code splitting

### Alert Deduplication

**Strategy:**
- localStorage tracking
- 24-hour expiry
- 10% bracket grouping

**Benefits:**
- Prevents alert spam
- Better UX
- Reduced toast noise

---

## Error Handling

### Database Errors

**Pattern:**
```typescript
const { data, error } = await supabase.from('category_budgets')...
if (error) throw error;
```

**Handling:**
- React Query catches errors
- onError callback shows toast
- User sees friendly message

### Validation Errors

**Client-side:**
```typescript
// Amount validation
if (amount <= 0) {
  toast.error('Budget amount must be greater than 0');
  return;
}

// Category validation
if (!selectedCategory) {
  toast.error('Please select a category');
  return;
}
```

**Database-side:**
- CHECK constraints
- UNIQUE constraints
- RLS policies

### Edge Cases

**Handled:**
- No budgets exist (empty state)
- All budgets on track (success message)
- Deleted category (foreign key prevents)
- Duplicate budget (UNIQUE constraint prevents)
- Negative amount (CHECK constraint prevents)
- Invalid period (CHECK constraint prevents)

---

## Testing Considerations

### Unit Tests

**Suggested Coverage:**
- Type definitions
- Helper functions (generateAlertKey, getShownAlerts, etc.)
- Status calculation logic
- Statistics calculations

**Example:**
```typescript
describe('generateAlertKey', () => {
  it('should generate correct key for 85% warning', () => {
    const budget = { id: '123', status: 'warning', percentage: 85 };
    expect(generateAlertKey(budget)).toBe('123-warning-8');
  });
});
```

### Integration Tests

**Suggested Coverage:**
- Budget CRUD operations
- Spending calculation accuracy
- Alert triggering at thresholds
- localStorage tracking

### E2E Tests

**Suggested Coverage:**
- Create budget flow
- Edit budget flow
- Delete budget flow
- Tab navigation
- Alert display
- Statistics update

---

## Security

### Row Level Security (RLS)

**Enabled**: Yes, on category_budgets table

**Policies**: 4 policies (SELECT, INSERT, UPDATE, DELETE)

**Enforcement**: All queries automatically filtered by `auth.uid()`

### Data Validation

**Client-side:**
- Type checking (TypeScript)
- Form validation (React)
- Amount > 0 check

**Server-side:**
- CHECK constraints
- UNIQUE constraints
- Foreign key constraints
- RLS policies

### Authentication

**Requirement**: All budget operations require authenticated user

**Implementation**: Supabase auth.uid() in RLS policies

---

## Future Enhancements

### Possible Features

1. **Historical Tracking**
   - Track budget performance over time
   - Monthly/yearly reports
   - Trend analysis

2. **Budget Templates**
   - Save common budget configurations
   - Quick setup for new users
   - Share templates

3. **Rollover Budgets**
   - Carry unused budget to next period
   - Configurable per budget
   - Savings tracking

4. **Budget Goals**
   - Set reduction targets
   - Track progress
   - Gamification

5. **Shared Budgets**
   - Family/household budgets
   - Multi-user tracking
   - Permission management

6. **Advanced Alerts**
   - Email notifications
   - SMS alerts
   - Custom thresholds (not just 80%/100%)

7. **Budget Forecasting**
   - Predict end-of-period spending
   - ML-based recommendations
   - Anomaly detection

---

## Troubleshooting

### Common Issues

**Issue**: Spending not updating
- **Cause**: Cache not invalidated
- **Solution**: Check React Query devtools, manually refetch

**Issue**: Duplicate budget error
- **Cause**: UNIQUE constraint violation
- **Solution**: Check existing budgets, period must differ

**Issue**: Alerts showing repeatedly
- **Cause**: localStorage cleared or expired
- **Solution**: Normal behavior, alerts reset after 24 hours

**Issue**: Wrong spending amount
- **Cause**: Transaction date outside period
- **Solution**: Verify transaction dates, check period type

### Debugging

**React Query Devtools:**
```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

**localStorage Inspection:**
```javascript
// View shown alerts
JSON.parse(localStorage.getItem('budget-alerts-shown'));

// Clear alerts (testing)
localStorage.removeItem('budget-alerts-shown');
```

**Database Queries:**
```sql
-- Check budgets for user
SELECT * FROM category_budgets WHERE user_id = 'your-user-id';

-- Check spending for category
SELECT SUM(ABS(amount)) 
FROM transactions 
WHERE category_id = 'category-id' 
  AND type = 'expense'
  AND date >= '2025-10-01'
  AND date <= '2025-10-31';
```

---

## API Reference

### Zustand Store Methods

**Location**: `src/lib/store/index.ts`

```typescript
// Fetch all budgets
fetchCategoryBudgets: () => Promise<void>

// Save (create/update) budget
saveCategoryBudget: (budget: CategoryBudget) => Promise<void>

// Add budget (alternative to save)
addCategoryBudget: (budget: CategoryBudget) => Promise<void>

// Update budget
updateCategoryBudget: (id: string, budget: Partial<CategoryBudget>) => Promise<void>

// Delete budget
deleteCategoryBudget: (id: string) => Promise<void>
```

### Query Keys

```typescript
const queryKeys = {
  budgets: ['budgets'] as const,
  budgetSpending: (categoryId: string, period: BudgetPeriod) =>
    ['budgets', 'spending', categoryId, period] as const,
};
```

---

## Code Examples

### Create a Budget

```typescript
const { mutate: createBudget } = useCreateBudget();

createBudget({
  category_id: 'abc-123',
  amount: 500,
  period: 'monthly',
});
```

### Update a Budget

```typescript
const { mutate: updateBudget } = useUpdateBudget();

updateBudget({
  id: 'budget-id',
  params: {
    amount: 600,
    period: 'yearly',
  },
});
```

### Calculate Spending

```typescript
const { data: spending } = useBudgetSpending('category-id', 'monthly');
console.log(`Spent: $${spending}`);
```

### Get All Budgets with Spending

```typescript
const { data: budgets, isLoading } = useBudgetsWithSpending();

budgets.forEach(budget => {
  console.log(`${budget.categories?.name}: ${budget.percentage}% used`);
});
```

### Monitor Alerts

```typescript
// In component or page
useBudgetAlerts(); // Automatically monitors and shows alerts
```

### Get Alert Counts

```typescript
const { exceededCount, warningCount, totalCount } = useBudgetAlertsCount();

console.log(`${totalCount} budgets need attention`);
```

---

## Migration Notes

### From Legacy System

If migrating from an older budget system:

1. **Data Migration**: Map old budget records to new schema
2. **Period Conversion**: Convert frequency to 'monthly' or 'yearly'
3. **Category Mapping**: Ensure categories exist in categories table
4. **User Association**: Link budgets to auth.users

### Database Migration

See: `docs/database/migration_add_budgets.sql`

**Steps:**
1. Create category_budgets table
2. Add indexes
3. Enable RLS
4. Create policies
5. Test with sample data

---

## Dependencies

### NPM Packages

```json
{
  "@tanstack/react-query": "^5.x",
  "@supabase/supabase-js": "^2.x",
  "zustand": "^4.x",
  "sonner": "^1.x",
  "date-fns": "^3.x",
  "react-router-dom": "^6.x",
  "lucide-react": "^0.x"
}
```

### Internal Dependencies

- `src/lib/supabase/client.ts`: Supabase client instance
- `src/lib/hooks/use-categories.ts`: Category data
- `src/components/ui/*`: shadcn/ui components

---

## Changelog

### Version 1.0.0 (October 31, 2025)

**Initial Release:**
- ✅ Database schema with RLS
- ✅ TypeScript types
- ✅ 6 React Query hooks
- ✅ 5 UI components
- ✅ Alert monitoring system
- ✅ Dashboard integration
- ✅ Sidebar badge
- ✅ Comprehensive documentation

---

## Contact & Support

For technical questions or issues:
1. Check this documentation
2. Review the code comments
3. Inspect React Query devtools
4. Check browser console for errors

---

**Last Updated**: October 31, 2025  
**Version**: 1.0.0  
**Module**: Budgets  
**Maintainer**: Development Team
