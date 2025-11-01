# User Preferences Migration Guide

## Issue Resolved
✅ **Fixed**: The `user_preferences` table now creates properly with all necessary fields.

---

## Quick Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire content from:
   ```
   docs/database/migration_add_user_tour.sql
   ```
4. Click **Run** button
5. Verify success message: `"User preferences table created successfully"`

### Option 2: Command Line

```bash
# If you have psql access to your Supabase database
psql -h YOUR_DB_HOST \
     -U postgres \
     -d postgres \
     -f docs/database/migration_add_user_tour.sql
```

---

## What This Migration Creates

### 1. **user_preferences Table**

```sql
CREATE TABLE user_preferences (
    id                      UUID PRIMARY KEY,
    user_id                 UUID UNIQUE REFERENCES auth.users,
    
    -- Tour tracking
    tour_completed          BOOLEAN DEFAULT FALSE,
    tour_completed_at       TIMESTAMPTZ,
    tour_version            TEXT DEFAULT '1.0.0',
    tours_viewed            TEXT[],
    
    -- General preferences
    currency                TEXT DEFAULT 'USD',
    date_format             TEXT DEFAULT 'MM/DD/YYYY',
    theme                   TEXT DEFAULT 'system',
    notifications_enabled   BOOLEAN DEFAULT TRUE,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. **Row Level Security (RLS)**

- ✅ Users can only access their own preferences
- ✅ CRUD policies for SELECT, INSERT, UPDATE, DELETE
- ✅ Automatic enforcement via Supabase auth

### 3. **Automatic Triggers**

- ✅ **Auto-update timestamp**: `updated_at` updates automatically
- ✅ **Auto-initialize**: New users get preferences row automatically

### 4. **Indexes for Performance**

- ✅ `user_id` index for fast lookups
- ✅ `tour_completed` partial index for new users

---

## Verification Steps

After running the migration, verify it worked:

### 1. Check Table Exists

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_preferences';
```

**Expected**: Should return 1 row with `user_preferences`

### 2. Check Columns

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_preferences'
ORDER BY ordinal_position;
```

**Expected**: Should show all columns including tour fields

### 3. Check Policies

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_preferences';
```

**Expected**: Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)

### 4. Check Triggers

```sql
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'user_preferences';
```

**Expected**: Should show `trigger_user_preferences_updated_at`

### 5. Test Auto-Creation

Sign up a new user in your app, then check:

```sql
SELECT * FROM user_preferences 
WHERE user_id = 'YOUR_NEW_USER_ID';
```

**Expected**: Preferences row automatically created

---

## Rollback (If Needed)

If you need to undo this migration:

```bash
# Run rollback script
psql -f docs/database/migration_add_user_tour_rollback.sql
```

Or in Supabase SQL Editor:
```
docs/database/migration_add_user_tour_rollback.sql
```

⚠️ **Warning**: This will delete all user preferences data!

---

## Troubleshooting

### Error: "relation auth.users does not exist"

**Solution**: Make sure you're running this in Supabase (which has `auth.users`)

### Error: "permission denied"

**Solution**: Make sure you're logged in as postgres or have admin privileges

### Error: "trigger already exists"

**Solution**: The script includes `DROP TRIGGER IF EXISTS`, so this shouldn't happen. If it does:

```sql
DROP TRIGGER IF EXISTS trigger_initialize_user_preferences ON auth.users;
DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON user_preferences;
-- Then re-run migration
```

### App Still Showing Errors?

**Check**: Make sure your app server restarted after the migration

```bash
# Restart your dev server
npm run dev
```

---

## Testing After Migration

### 1. Test Tour Service

```typescript
import { hasCompletedTour, saveTourCompletion } from '@/lib/services/user-tour.service';

// Check status
const completed = await hasCompletedTour('main');
console.log('Tour completed:', completed);

// Save completion
await saveTourCompletion('main');
```

### 2. Test in Browser

1. Clear your browser cache
2. Sign up as a new user
3. Tour should start automatically
4. Check browser console for any errors
5. Complete the tour
6. Refresh page - tour should not restart
7. Go to Settings → "Start Tour" should work

---

## Migration Status Checklist

After running the migration, verify:

- [ ] Table `user_preferences` exists
- [ ] All columns present (tour_completed, tour_version, etc)
- [ ] RLS policies active (4 policies)
- [ ] Triggers created (2 triggers)
- [ ] Indexes created (2 indexes)
- [ ] New users get preferences automatically
- [ ] Existing users can query their preferences
- [ ] App tour starts for new users
- [ ] "Restart Tour" works in Settings

---

## Quick Test Script

Run this in Supabase SQL Editor to test everything:

```sql
-- 1. Check table exists
SELECT 'Table exists' as test, 
       EXISTS(SELECT 1 FROM information_schema.tables 
              WHERE table_name = 'user_preferences') as result;

-- 2. Check RLS enabled
SELECT 'RLS enabled' as test,
       relrowsecurity as result
FROM pg_class 
WHERE relname = 'user_preferences';

-- 3. Check policies
SELECT 'Policies count' as test,
       COUNT(*) as result
FROM pg_policies 
WHERE tablename = 'user_preferences';

-- 4. Check triggers
SELECT 'Triggers count' as test,
       COUNT(*) as result
FROM information_schema.triggers 
WHERE event_object_table = 'user_preferences';

-- 5. Check columns
SELECT 'Tour columns' as test,
       COUNT(*) as result
FROM information_schema.columns
WHERE table_name = 'user_preferences'
AND column_name IN ('tour_completed', 'tour_version', 'tours_viewed');
```

**Expected Results:**
- Table exists: `true`
- RLS enabled: `true`
- Policies count: `4`
- Triggers count: `1` (or more if you have others)
- Tour columns: `3`

---

## Success Criteria

✅ Migration is successful when:

1. No SQL errors during execution
2. All verification queries pass
3. New user signup creates preferences row
4. App tour works without errors
5. Settings "Restart Tour" functions properly

---

## Support

If you encounter issues:

1. Check the error message carefully
2. Run verification queries above
3. Check Supabase logs
4. Review the SQL script for any modifications needed
5. Try the rollback script and re-run migration

---

**Status**: ✅ Migration script updated and ready to run!

The fixed migration will:
- ✅ Create the table from scratch
- ✅ Set up all security policies
- ✅ Add automatic triggers
- ✅ Create performance indexes
- ✅ Initialize preferences for new users automatically
