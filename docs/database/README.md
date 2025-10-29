# Database Documentation

Welcome to the Budget Manager database documentation! All SQL migrations and setup guides are organized here.

## 🚀 Quick Start

**New user? Start here:**

1. **[QUICK_MIGRATION.md](./QUICK_MIGRATION.md)** - 30-second visual overview
2. **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Step-by-step setup guide
3. Execute **`../src/lib/supabase/schema.sql`** in Supabase SQL Editor

That's it! Your database is ready. ✅

---

## 📚 Documentation Files

### Essential Guides

| File | Purpose | Read Time |
|------|---------|-----------|
| **[QUICK_MIGRATION.md](./QUICK_MIGRATION.md)** | Visual quick start | 30 seconds |
| **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** | Quick reference guide | 2 minutes |
| **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** | Complete guide with troubleshooting | 10-15 minutes |
| **[SQL_ORGANIZATION_SUMMARY.md](./SQL_ORGANIZATION_SUMMARY.md)** | Reorganization details | 5 minutes |
| **[DOCS_INDEX.md](./DOCS_INDEX.md)** | Navigation hub | 1 minute |

### Schema & Migration Files

| File | Status | Purpose |
|------|--------|---------|
| **[../src/lib/supabase/schema.sql](../../src/lib/supabase/schema.sql)** | ✅ **USE THIS** | Complete database schema |
| [migration_add_budgets.sql](./migration_add_budgets.sql) | ⚠️ Deprecated | Legacy - budgets only |
| [migration_add_recurring.sql](./migration_add_recurring.sql) | ⚠️ Deprecated | Legacy - recurring only |

### Helper Tools

| File | Purpose |
|------|---------|
| [migrate.sh](./migrate.sh) | Interactive migration helper script |
| [SQL_FILES_STRUCTURE.txt](./SQL_FILES_STRUCTURE.txt) | Visual structure diagram |

---

## 📋 What Gets Created

When you run the schema, you get:

- ✅ **6 Tables** - All data storage (categories, transactions, savings_goals, user_settings, category_budgets, recurring_transactions)
- ✅ **12 Indexes** - Performance optimization
- ✅ **24 RLS Policies** - Complete security
- ✅ **1 Function** - Recurring transaction automation

---

## 🎯 One-Command Migration

### Method 1: Supabase Dashboard (Recommended)

```bash
1. Copy the entire contents of: ../src/lib/supabase/schema.sql
2. Go to Supabase Dashboard → SQL Editor → New Query
3. Paste and click "Run"
4. Done! ✅
```

### Method 2: Interactive Script

```bash
./migrate.sh
```

### Method 3: Supabase CLI

```bash
supabase link --project-ref your-project-ref
# Then copy schema.sql to SQL Editor
```

---

## 🗂️ Folder Structure

```
docs/database/
├── README.md                          ← You are here
├── QUICK_MIGRATION.md                 ← Start here for new users
├── DATABASE_SETUP.md                  ← Quick setup guide
├── MIGRATION_GUIDE.md                 ← Detailed guide
├── SQL_ORGANIZATION_SUMMARY.md        ← Technical details
├── DOCS_INDEX.md                      ← Navigation hub
├── SQL_FILES_STRUCTURE.txt            ← Visual diagram
├── migrate.sh                         ← Helper script
├── migration_add_budgets.sql          ← Deprecated
└── migration_add_recurring.sql        ← Deprecated

../../src/lib/supabase/
└── schema.sql                         ← THE MAIN SCHEMA FILE
```

---

## 📖 Documentation Levels

### For Beginners

→ Start with [QUICK_MIGRATION.md](./QUICK_MIGRATION.md)

### For Quick Setup

→ Use [DATABASE_SETUP.md](./DATABASE_SETUP.md)

### For Troubleshooting

→ Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

### For Deep Understanding

→ Read [SQL_ORGANIZATION_SUMMARY.md](./SQL_ORGANIZATION_SUMMARY.md)

### For Navigation

→ Browse [DOCS_INDEX.md](./DOCS_INDEX.md)

---

## 💡 Key Features

- ✅ **One File Migration** - Everything in schema.sql
- ✅ **Multiple Methods** - Dashboard, CLI, or psql
- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Well Documented** - Guides for all levels
- ✅ **Production Ready** - Includes best practices

---

## 🆘 Need Help?

- **Quick question?** → Check [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- **Something not working?** → See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) troubleshooting
- **Want to understand more?** → Read [SQL_ORGANIZATION_SUMMARY.md](./SQL_ORGANIZATION_SUMMARY.md)

---

## 📊 Database Schema Overview

### Tables

1. **categories** - Income/expense categories with color-coding
2. **transactions** - All financial transactions
3. **savings_goals** - Savings targets with progress tracking
4. **user_settings** - User preferences and opening balance
5. **category_budgets** - Budget limits (monthly/yearly)
6. **recurring_transactions** - Recurring payment templates

### Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- 4 policies per table (SELECT, INSERT, UPDATE, DELETE)

### Performance

- Indexes on user_id for fast user queries
- Indexes on dates for time-based filtering
- Indexes on category_id for category lookups
- Partial index for active recurring transactions

---

**Last Updated**: October 29, 2025  
**Schema Version**: 2.0 (Consolidated)

---

[← Back to Project README](../../README.md)
