# Database Migrations - Execution Guide

## Overview

This guide provides step-by-step instructions for running all pending database migrations for the Budget Manager application.

---

## 📋 Available Migrations

| Migration File | Status | Size | Features |
|---------------|--------|------|----------|
| `migration_add_budgets.sql` | ✅ Likely Run | 1.8 KB | Basic budgets table |
| `migration_add_notifications.sql` | ✅ Likely Run | 4.5 KB | Basic notifications |
| `migration_add_recurring.sql` | ✅ Likely Run | 5.0 KB | Recurring transactions |
| `migration_add_bank_accounts.sql` | ✅ Likely Run | 9.8 KB | Bank accounts |
| `migration_add_payment_cards.sql` | ✅ Likely Run | 14.2 KB | Payment cards |
| `migration_add_loans.sql` | ✅ Likely Run | 18.3 KB | Loans management |
| **`migration_add_security.sql`** | ⏳ **NEEDS RUN** | 16.7 KB | **PIN, biometric, encryption** |
| **`migration_add_investments.sql`** | ⏳ **NEEDS RUN** | 10.4 KB | **Investments module** |
| **`migration_add_assets.sql`** | ⏳ **NEEDS RUN** | 15.8 KB | **Assets module** |
| **`migration_enhanced_notifications.sql`** | ⏳ **NEEDS RUN** | 14.8 KB | **Smart notifications** |

---

## 🎯 Migrations to Execute (Priority Order)

### 1. Security Module ⚠️ HIGH PRIORITY
**File**: `docs/database/migration_add_security.sql`

**Features**:
- Security settings table (PIN, biometric, auto-logout)
- Security audit log
- Authentication attempts tracking
- Row Level Security (RLS) policies
- Triggers for audit logging

**Size**: 16,668 bytes

---

### 2. Enhanced Notifications 📢 HIGH PRIORITY
**File**: `docs/database/migration_enhanced_notifications.sql`

**Features**:
- Enhanced notifications table (replaces basic one)
- Notification templates
- Notification schedules
- Notification preferences
- Smart alert detection
- Delivery tracking

**Size**: 14,759 bytes

**⚠️ Note**: This **replaces** the basic `migration_add_notifications.sql`. If basic notifications table exists, this migration will drop and recreate it with enhanced features.

---

### 3. Investments Module 💼 MEDIUM PRIORITY
**File**: `docs/database/migration_add_investments.sql`

**Features**:
- Investments table (stocks, bonds, mutual funds, crypto, etc.)
- 10 investment types
- Profit & Loss calculations
- Market value tracking
- Portfolio analytics

**Size**: 10,385 bytes

---

### 4. Assets Module 🏠 MEDIUM PRIORITY
**File**: `docs/database/migration_add_assets.sql`

**Features**:
- Assets table (property, vehicle, jewelry, electronics, etc.)
- 8 asset types
- Depreciation calculations
- Insurance tracking
- Warranty management
- Document storage

**Size**: 15,810 bytes

---

## 🔧 Execution Methods

### Method 1: Supabase Dashboard (Recommended)

**Steps**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy content from migration file
6. Paste into SQL Editor
7. Click **Run** (or press `Ctrl+Enter`)
8. Verify success message
9. Repeat for each migration file

**Advantages**:
- ✅ Visual feedback
- ✅ Easy error messages
- ✅ No local setup required

---

### Method 2: Supabase CLI

**Prerequisites**:
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

**Execute Migrations**:
```bash
# Method A: Run single migration
supabase db execute -f docs/database/migration_add_security.sql

# Method B: Run all migrations in order
supabase db execute -f docs/database/migration_add_security.sql
supabase db execute -f docs/database/migration_enhanced_notifications.sql
supabase db execute -f docs/database/migration_add_investments.sql
supabase db execute -f docs/database/migration_add_assets.sql
```

**Advantages**:
- ✅ Command-line workflow
- ✅ Can be automated
- ✅ Works with version control

---

### Method 3: psql (Direct PostgreSQL)

**Prerequisites**:
```bash
# Install PostgreSQL client
sudo apt-get install postgresql-client  # Ubuntu/Debian
brew install postgresql                # macOS

# Get connection string from Supabase Dashboard
# Settings → Database → Connection string (psql)
```

**Execute Migrations**:
```bash
# Set connection string
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run migrations
psql $DATABASE_URL -f docs/database/migration_add_security.sql
psql $DATABASE_URL -f docs/database/migration_enhanced_notifications.sql
psql $DATABASE_URL -f docs/database/migration_add_investments.sql
psql $DATABASE_URL -f docs/database/migration_add_assets.sql
```

**Advantages**:
- ✅ Direct database access
- ✅ Powerful CLI tools
- ✅ Can script with bash

---

## 📝 Execution Checklist

### Pre-Migration
- [ ] Backup current database (Supabase Dashboard → Database → Backups → Create Backup)
- [ ] Review migration file contents
- [ ] Check for any custom modifications needed
- [ ] Ensure no active users during migration (optional)

### During Migration
- [ ] Execute migrations **one by one** in order
- [ ] Wait for success confirmation
- [ ] Check for error messages
- [ ] Verify table creation (Supabase Dashboard → Table Editor)

### Post-Migration
- [ ] Verify tables exist in Supabase Dashboard
- [ ] Check RLS policies are enabled
- [ ] Test features in application:
  - [ ] Security: Try setting PIN, enabling biometric
  - [ ] Notifications: Create transaction, check for alerts
  - [ ] Investments: Add investment, view portfolio
  - [ ] Assets: Add asset, view depreciation
- [ ] Check for console errors in browser
- [ ] Verify data integrity

---

## 🔍 Verification Queries

After running migrations, verify tables exist:

```sql
-- Check if security tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('security_settings', 'security_audit_log', 'auth_attempts');

-- Check if enhanced notifications tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'notification_templates', 'notification_schedules', 'notification_preferences');

-- Check if investment tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'investments';

-- Check if asset tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'assets';

-- Count rows in new tables (should be 0 initially)
SELECT 
    'security_settings' as table_name, COUNT(*) as row_count FROM security_settings
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'investments', COUNT(*) FROM investments
UNION ALL
SELECT 'assets', COUNT(*) FROM assets;
```

---

## ⚠️ Troubleshooting

### Error: "relation already exists"
**Cause**: Table already created from previous migration attempt

**Solution**:
```sql
-- Drop existing table and re-run migration
DROP TABLE IF EXISTS table_name CASCADE;
```

---

### Error: "permission denied"
**Cause**: RLS policies preventing access

**Solution**: Temporarily disable RLS during migration (if needed):
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- Run your queries
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

---

### Error: "syntax error"
**Cause**: SQL syntax issue or incompatible PostgreSQL version

**Solution**:
1. Check PostgreSQL version: `SELECT version();`
2. Review migration file for typos
3. Run migration line by line to isolate error

---

### Enhanced Notifications Migration Issues

**If basic notifications table exists**:
```sql
-- Check current notifications table structure
\d notifications

-- Migration will DROP and recreate notifications table
-- Backup existing data if needed:
CREATE TABLE notifications_backup AS SELECT * FROM notifications;

-- Then run migration
-- After migration, restore data if needed:
INSERT INTO notifications (user_id, type, title, message, priority, channel, is_read, created_at)
SELECT user_id, type, title, message, priority, 'in-app', is_read, created_at 
FROM notifications_backup;
```

---

## 🎯 Migration Order (Recommended)

Execute in this exact order to avoid dependency issues:

```bash
# 1. Security (no dependencies)
supabase db execute -f docs/database/migration_add_security.sql

# 2. Enhanced Notifications (no dependencies, replaces basic)
supabase db execute -f docs/database/migration_enhanced_notifications.sql

# 3. Investments (no dependencies)
supabase db execute -f docs/database/migration_add_investments.sql

# 4. Assets (no dependencies)
supabase db execute -f docs/database/migration_add_assets.sql
```

**Total Migration Time**: ~5-10 minutes

---

## 📊 Post-Migration Feature Testing

### Test Security Module
1. Go to Settings → Security
2. Set up PIN (6 digits)
3. Enable biometric authentication
4. Set auto-logout to 5 minutes
5. Logout and login → Verify PIN screen appears
6. Check security audit log (in Supabase → Table Editor)

### Test Notifications
1. Go to Expenses → Add expense for $450 (category with $500 budget)
2. Check Notifications page → Should see "Budget Warning" (90%)
3. Add another expense for $100 (same category)
4. Check Notifications → Should see "Budget Exceeded"
5. Click notification → Mark as read
6. Verify badge count decreases

### Test Investments
1. Go to Investments page
2. Click "Add Investment"
3. Fill form: Stock, Apple (AAPL), $10,000, 50 units
4. Submit
5. Verify appears in portfolio
6. Check P&L calculations

### Test Assets
1. Go to Assets page
2. Click "Add Asset"
3. Fill form: Vehicle, Toyota Camry, $25,000, 2020
4. Submit
5. Verify appears in asset list
6. Check depreciation calculation

---

## 🔄 Rollback Procedure (If Needed)

If migrations cause issues, you can rollback:

### From Supabase Dashboard
1. Go to Database → Backups
2. Select backup before migration
3. Click "Restore"
4. Wait for restoration to complete

### Manually Drop Tables
```sql
-- Drop security tables
DROP TABLE IF EXISTS auth_attempts CASCADE;
DROP TABLE IF EXISTS security_audit_log CASCADE;
DROP TABLE IF EXISTS security_settings CASCADE;

-- Drop notification tables
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notification_schedules CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Drop investment tables
DROP TABLE IF EXISTS investments CASCADE;

-- Drop asset tables
DROP TABLE IF EXISTS assets CASCADE;
```

---

## 📞 Support

**If you encounter issues**:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console for errors
3. Review migration file for syntax errors
4. Verify RLS policies are correct
5. Test with different user account

---

## ✅ Success Criteria

After successful migration:
- [ ] All 4 migration files executed without errors
- [ ] All new tables visible in Supabase Dashboard
- [ ] RLS policies enabled on all tables
- [ ] Security settings page loads without errors
- [ ] Notifications create and display correctly
- [ ] Investments page shows portfolio
- [ ] Assets page shows asset list
- [ ] No console errors in browser
- [ ] Application works as expected

---

## 📝 Migration Log Template

Keep track of migrations:

```
Migration Log - Budget Manager
================================

Date: [YYYY-MM-DD]
Executed By: [Your Name]

Migration 1: migration_add_security.sql
- Status: ✅ Success / ❌ Failed
- Time: [HH:MM]
- Notes: [Any issues or observations]

Migration 2: migration_enhanced_notifications.sql
- Status: ✅ Success / ❌ Failed
- Time: [HH:MM]
- Notes: [Any issues or observations]

Migration 3: migration_add_investments.sql
- Status: ✅ Success / ❌ Failed
- Time: [HH:MM]
- Notes: [Any issues or observations]

Migration 4: migration_add_assets.sql
- Status: ✅ Success / ❌ Failed
- Time: [HH:MM]
- Notes: [Any issues or observations]

Post-Migration Testing:
- Security: ✅ / ❌
- Notifications: ✅ / ❌
- Investments: ✅ / ❌
- Assets: ✅ / ❌

Overall Status: ✅ All systems operational
```

---

**Next Step**: Choose your preferred method and execute migrations one by one! 🚀
