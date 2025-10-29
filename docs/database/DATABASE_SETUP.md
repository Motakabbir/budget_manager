# Database Setup - Quick Reference

## 🚀 One-Command Migration

### Step 1: Copy the Schema File

Copy the entire contents of:

```
src/lib/supabase/schema.sql
```

### Step 2: Execute in Supabase

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Paste the schema
5. Click **Run** (or press `Ctrl + Enter`)

### Step 3: Done! ✅

All 6 tables, 12 indexes, 24 RLS policies, and 1 function are now created.

---

## What You Get

| Feature | Status |
|---------|--------|
| Categories (Income/Expense) | ✅ |
| Transactions Tracking | ✅ |
| Savings Goals | ✅ |
| Budget vs Actual | ✅ |
| Recurring Transactions | ✅ |
| Opening Balance | ✅ |
| Row Level Security | ✅ |
| Multi-user Support | ✅ |

---

## Tables Created

1. **categories** - Store your income/expense categories
2. **transactions** - All your financial transactions
3. **savings_goals** - Track savings goals with deadlines
4. **user_settings** - User preferences & opening balance
5. **category_budgets** - Budget limits per category
6. **recurring_transactions** - Templates for recurring payments

---

## Alternative Methods

### Via Supabase CLI

```bash
supabase link --project-ref your-project-ref
supabase db push --sql-file src/lib/supabase/schema.sql
```

### Via psql

```bash
psql "postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
\i src/lib/supabase/schema.sql
```

---

## Need More Details?

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for:

- Detailed verification steps
- Troubleshooting guide
- Database schema diagram
- Update procedures

---

## Files Overview

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/supabase/schema.sql` | **Complete database schema** | ✅ **USE THIS** |
| `migration_add_budgets.sql` | Legacy - Budgets only | ⚠️ Deprecated |
| `migration_add_recurring.sql` | Legacy - Recurring only | ⚠️ Deprecated |

---

**💡 Tip:** Always backup your data before running migrations on existing databases!
