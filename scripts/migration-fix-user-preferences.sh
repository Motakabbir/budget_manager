#!/bin/bash

# User Preferences Migration - Quick Fix
# Issue: user_preferences table doesn't exist
# Solution: Create table with all fields

echo "🔧 User Preferences Migration - Quick Fix"
echo "=========================================="
echo ""
echo "❌ Issue: relation 'user_preferences' does not exist"
echo "✅ Solution: Updated migration script to CREATE TABLE"
echo ""

echo "📋 What Changed:"
echo "  - Migration now CREATES the table (not just ALTER)"
echo "  - Adds tour tracking columns"
echo "  - Sets up Row Level Security"
echo "  - Creates automatic triggers"
echo "  - Adds performance indexes"
echo ""

echo "🚀 How to Run the Migration:"
echo ""
echo "Option 1: Supabase Dashboard (Recommended)"
echo "  1. Open your Supabase project"
echo "  2. Go to SQL Editor"
echo "  3. Copy and paste from:"
echo "     docs/database/migration_add_user_tour.sql"
echo "  4. Click 'Run'"
echo "  5. Verify success message"
echo ""

echo "Option 2: Command Line (If you have psql access)"
echo "  psql -h YOUR_DB_HOST \\"
echo "       -U postgres \\"
echo "       -d postgres \\"
echo "       -f docs/database/migration_add_user_tour.sql"
echo ""

echo "📁 Files Updated:"
echo "  ✅ docs/database/migration_add_user_tour.sql (FIXED)"
echo "  ✅ docs/database/migration_add_user_tour_rollback.sql (NEW)"
echo "  ✅ docs/database/MIGRATION_GUIDE_USER_PREFERENCES.md (NEW)"
echo ""

echo "🧪 After Migration, Test:"
echo "  1. npm run dev"
echo "  2. Sign up as new user"
echo "  3. Tour should auto-start"
echo "  4. Complete tour"
echo "  5. Refresh - tour shouldn't restart"
echo "  6. Settings → 'Start Tour' → Should work"
echo ""

echo "📊 What Gets Created:"
echo "  📋 Table: user_preferences"
echo "  🔒 RLS Policies: 4 (view, insert, update, delete)"
echo "  ⚙️  Triggers: 2 (auto-update, auto-initialize)"
echo "  📈 Indexes: 2 (user_id, tour_completed)"
echo ""

echo "✅ Ready to run migration!"
echo ""
echo "Need help? Check:"
echo "  docs/database/MIGRATION_GUIDE_USER_PREFERENCES.md"
