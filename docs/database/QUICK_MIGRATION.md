# 🎯 Quick Start: Database Migration

## Before (Multiple Files - Confusing ❌)

```
migration_add_budgets.sql        ← Run first?
migration_add_recurring.sql      ← Run second?
schema.sql                       ← Run third?
```

**Problem**: Users don't know which order to run files!

---

## After (One File - Simple ✅)

```
src/lib/supabase/schema.sql      ← Run this ONE file!
```

**Solution**: Everything in one place, one command!

---

## 🚀 How to Use

### Copy → Paste → Run

1. **Open** `../../src/lib/supabase/schema.sql`
2. **Copy** all the content (Ctrl+A, Ctrl+C)
3. **Go to** Supabase Dashboard → SQL Editor
4. **Paste** and click **Run**
5. **Done!** ✅

**Time needed**: ~30 seconds

---

## 📦 What You Get

```
✅ 6 Tables          → Store all your data
✅ 12 Indexes        → Fast queries
✅ 24 Security Rules → Protect user data
✅ 1 Function        → Auto-recurring transactions
```

---

## 📖 Need Help?

| Quick Start | Detailed Info |
|-------------|---------------|
| [DATABASE_SETUP.md](./DATABASE_SETUP.md) | [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) |
| ⚡ 2 min read | 📚 Complete guide |

---

## ✨ That's It

Your database is ready to use. Start building! 🎉

```
One File → One Command → One Minute
```
