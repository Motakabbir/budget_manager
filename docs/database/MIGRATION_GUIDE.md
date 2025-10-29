# Database Migration Guide

## Overview

This guide explains how to set up the complete Budget Manager database schema in Supabase with a single command.

## Quick Start (One Command Migration)

### Option 1: Via Supabase Dashboard (Recommended)

1. **Log in to your Supabase project**
   - Go to [https://supabase.com](https://supabase.com)
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute the complete schema**
   - Copy the entire contents of `src/lib/supabase/schema.sql`
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl + Enter`

4. **Verify success**
   - All tables, indexes, policies, and functions will be created
   - You should see "Success. No rows returned" message

### Option 2: Via Supabase CLI

```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push --sql-file src/lib/supabase/schema.sql
```

### Option 3: Via psql Command Line

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Execute the schema file
\i src/lib/supabase/schema.sql
```

## What Gets Created

### Tables (6 Total)

1. **categories** - User-defined income and expense categories
2. **transactions** - All income and expense transactions
3. **savings_goals** - Savings goals with targets and deadlines
4. **user_settings** - User preferences and opening balance
5. **category_budgets** - Budget limits per category (monthly/yearly)
6. **recurring_transactions** - Templates for recurring transactions

### Indexes (12 Total)

- Optimized for user queries, date filtering, and category lookups
- Partial index on active recurring transactions

### Row Level Security (RLS)

- All tables have RLS enabled
- 24 policies ensuring users can only access their own data
- Secure by default - users cannot access other users' data

### Functions (1 Total)

- `create_recurring_transaction(UUID)` - Automatically creates transactions from recurring templates and updates next occurrence

## Database Schema Structure

```
┌─────────────────┐
│   auth.users    │ (Supabase Auth)
└────────┬────────┘
         │
         ├──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
         │              │              │              │              │              │
         ▼              ▼              ▼              ▼              ▼              ▼
┌─────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
│ categories  │ │ transactions │ │ savings_goals│ │user_settings │ │category_     │ │recurring_            │
│             │ │              │ │              │ │              │ │budgets       │ │transactions          │
└──────┬──────┘ └──────┬───────┘ └──────────────┘ └──────────────┘ └──────┬───────┘ └──────┬───────────────┘
       │               │                                                    │                │
       └───────────────┴────────────────────────────────────────────────────┴────────────────┘
                                    (Foreign Key Relationships)
```

## Features Enabled

### ✅ Core Features

- User authentication (via Supabase Auth)
- Multi-user support with data isolation
- Income and expense tracking
- Category management
- Transaction history

### ✅ Advanced Features

- Savings goals tracking
- Budget vs. Actual reporting
- Recurring transactions support
- Opening balance management
- Monthly and yearly budget periods

## Verification Steps

After running the migration, verify everything is set up correctly:

### 1. Check Tables

```sql
-- Should return 6 tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'categories', 
    'transactions', 
    'savings_goals', 
    'user_settings', 
    'category_budgets', 
    'recurring_transactions'
);
```

### 2. Check RLS Policies

```sql
-- Should return 24 policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 3. Check Functions

```sql
-- Should return create_recurring_transaction
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'create_recurring_transaction';
```

### 4. Check Indexes

```sql
-- Should return 12 indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';
```

## Troubleshooting

### Issue: Policies Already Exist

If you see errors about existing policies:

```sql
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
-- (repeat for all policies)
-- Then run the schema again
```

### Issue: Tables Already Exist

The schema uses `CREATE TABLE IF NOT EXISTS`, so this shouldn't be an issue. However, if you need a fresh start:

```sql
-- WARNING: This deletes all data!
DROP TABLE IF EXISTS recurring_transactions CASCADE;
DROP TABLE IF EXISTS category_budgets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS savings_goals CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP FUNCTION IF EXISTS create_recurring_transaction(UUID);
-- Then run the schema again
```

### Issue: Foreign Key Constraint Errors

Make sure you're running the entire schema file in order. The tables are created in the correct dependency order.

## Updating an Existing Database

If you already have some tables and want to add the new ones:

1. **Backup your data first!**

```sql
-- Or use Supabase Dashboard -> Database -> Backups
```

2. **Run the complete schema**
   - The `IF NOT EXISTS` clauses will skip existing tables
   - Only new tables and features will be added

3. **Check for any missing indexes or policies**
   - The schema will create any missing indexes
   - Existing policies won't be duplicated

## Migration History

### Initial Schema (v1.0)

- `categories`, `transactions`, `savings_goals`, `user_settings`

### Budget Feature (v1.1)

- Added `category_budgets` table

### Recurring Transactions (v1.2)

- Added `recurring_transactions` table
- Added `create_recurring_transaction()` function

### Consolidated Schema (v2.0) - Current

- All features combined into single migration file
- Improved documentation and organization
- Added comprehensive comments

## Support

If you encounter any issues:

1. Check the Supabase logs in Dashboard -> Logs
2. Verify your Supabase project is active
3. Ensure you have the correct permissions
4. Review the error messages carefully

## Next Steps

After successful migration:

1. ✅ Test authentication flow
2. ✅ Create test categories
3. ✅ Add sample transactions
4. ✅ Set up your first budget
5. ✅ Create a recurring transaction template

Your Budget Manager database is now ready to use! 🎉
