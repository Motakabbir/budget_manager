# 🚀 QUICK FIX: User Preferences Migration

## ❌ Error You Saw
```
ERROR: 42P01: relation "user_preferences" does not exist
```

## ✅ What I Fixed
The migration script now **CREATES** the `user_preferences` table instead of trying to ALTER it.

---

## 🎯 What You Need To Do

### Step 1: Open Supabase
Go to your Supabase project → **SQL Editor**

### Step 2: Copy the Migration
Open and copy everything from:
```
docs/database/migration_add_user_tour.sql
```

### Step 3: Run It
Paste in SQL Editor and click **"Run"**

### Step 4: Verify Success
You should see:
```
✅ "User preferences table created successfully"
```

---

## 🧪 Test It Works

```bash
# 1. Restart your dev server
npm run dev

# 2. Test in browser:
#    - Sign up as new user
#    - Tour should start automatically
#    - Complete or skip tour
#    - Refresh page - tour shouldn't restart
#    - Go to Settings → "Start Tour" button should work
```

---

## 📊 What Gets Created

```
user_preferences table
├── 📋 Columns
│   ├── tour_completed (BOOLEAN)
│   ├── tour_version (TEXT)
│   ├── tours_viewed (TEXT[])
│   ├── currency (TEXT)
│   ├── theme (TEXT)
│   └── ... (10 total columns)
│
├── 🔒 Security
│   ├── RLS enabled
│   └── 4 policies (view/insert/update/delete)
│
├── ⚙️ Automation
│   ├── Auto-update timestamp trigger
│   └── Auto-create preferences for new users
│
└── 📈 Performance
    ├── user_id index
    └── tour_completed index
```

---

## 📁 Files You Can Reference

1. **Migration Script** (what to run)
   - `docs/database/migration_add_user_tour.sql`

2. **Rollback Script** (if you need to undo)
   - `docs/database/migration_add_user_tour_rollback.sql`

3. **Full Guide** (detailed instructions)
   - `docs/database/MIGRATION_GUIDE_USER_PREFERENCES.md`

---

## ✅ Success Checklist

After running the migration:

- [ ] No SQL errors
- [ ] Success message appears
- [ ] New users get tour automatically
- [ ] Tour completion saves to database
- [ ] "Restart Tour" button works in Settings
- [ ] No console errors in browser

---

## 🆘 If Something Goes Wrong

### Still Getting Errors?

1. **Check Supabase Logs**
   - Supabase Dashboard → Logs
   
2. **Verify Table Exists**
   ```sql
   SELECT * FROM user_preferences LIMIT 1;
   ```

3. **Try Rollback + Re-run**
   ```sql
   -- Run rollback first
   DROP TABLE IF EXISTS user_preferences CASCADE;
   
   -- Then run migration again
   ```

4. **Check Your Auth**
   - Make sure you're logged in to Supabase
   - Verify you have admin permissions

---

## 💡 Quick Reference

| What | Where | How |
|------|-------|-----|
| Migration File | `docs/database/migration_add_user_tour.sql` | Copy & paste in Supabase |
| Test Tour | Sign up new user | Should auto-start |
| Restart Tour | Settings page | Click "Start Tour" |
| Check Data | Supabase Table Editor | View `user_preferences` |

---

## 🎉 That's It!

The issue is fixed. Just run the migration in Supabase and you're good to go!

**Questions?** Check the full guide: `docs/database/MIGRATION_GUIDE_USER_PREFERENCES.md`
