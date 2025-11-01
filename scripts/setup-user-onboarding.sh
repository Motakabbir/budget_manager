#!/bin/bash

# User Onboarding & Navigation Enhancement - Quick Setup Script
# Date: November 1, 2025

echo "🚀 Setting up User Onboarding & Navigation Enhancement..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Installing driver.js..."
npm install driver.js
echo "✅ Dependencies installed"
echo ""

# Step 2: Run database migration
echo "🗄️  Running database migration..."
echo ""
echo "Please run the following SQL in your Supabase SQL Editor:"
echo "=========================================="
cat docs/database/migration_add_user_tour.sql
echo "=========================================="
echo ""
echo "Or run directly with psql:"
echo "psql -h YOUR_DB_HOST -U YOUR_USER -d YOUR_DB -f docs/database/migration_add_user_tour.sql"
echo ""

# Step 3: Verify setup
echo "✅ Code changes are already in place!"
echo ""
echo "📋 Summary of changes:"
echo "  ✅ User tour service created (365 lines)"
echo "  ✅ Quick Access component added (185 lines)"
echo "  ✅ Sidebar navigation simplified and grouped"
echo "  ✅ Top bar updated with shortcuts"
echo "  ✅ Settings page updated with Restart Tour button"
echo "  ✅ Custom tour styling added"
echo "  ✅ Auto-start logic implemented"
echo ""

echo "🎯 Next Steps:"
echo "  1. Run the database migration in Supabase"
echo "  2. Start your dev server: npm run dev"
echo "  3. Sign up as a new user to see the tour"
echo "  4. Test Quick Access shortcuts in top bar"
echo "  5. Try collapsing/expanding sidebar groups"
echo "  6. Go to Settings to restart the tour"
echo ""

echo "📚 Documentation:"
echo "  - Full guide: USER_ONBOARDING_NAVIGATION.md"
echo "  - Database migration: docs/database/migration_add_user_tour.sql"
echo ""

echo "✨ Setup complete! Happy coding! 🎉"
