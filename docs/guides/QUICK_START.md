# Quick Start Guide - Budget Manager

## 🚀 Get Running in 5 Minutes

### Step 1: Supabase Setup (2 minutes)

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - Name: `budget-manager`
   - Database Password: (choose strong password)
   - Region: (closest to you)
4. Wait for project creation (~1 min)

### Step 2: Get Credentials (1 minute)

1. In Supabase dashboard, click Project Settings (gear icon)
2. Go to "API" section
3. Copy:
   - Project URL
   - anon/public key

### Step 3: Configure App (30 seconds)

Update `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### Step 4: Create Database (1 minute)

1. In Supabase, go to "SQL Editor"
2. Click "New Query"
3. Copy ALL content from `lib/supabase/schema.sql`
4. Paste and click "Run"
5. Wait for success message

### Step 5: Start App (30 seconds)

```bash
npm run dev
```

Open http://localhost:3000

### Step 6: Test It Out!

1. Sign up for a new account
2. Add a category (e.g., "Salary" as Income)
3. Add an income transaction
4. View it on the dashboard!

## ✅ You're Done!

Your budget manager is running. Explore all features:
- Add more categories
- Track expenses
- Set savings goals
- Export reports

## 🆘 Troubleshooting

**Can't connect to Supabase?**
- Check .env.local has correct values
- Restart: `npm run dev`

**Database errors?**
- Make sure you ran the ENTIRE schema.sql
- Check Supabase > Table Editor to verify tables exist

**Need help?**
See SETUP_GUIDE.md for detailed instructions.

---

Happy budgeting! 💰
