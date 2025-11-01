#!/bin/bash

# Investments & Assets Migration Script
# Run database migrations for portfolio tracking features

echo "📈 Investments & Assets Module - Database Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if migration files exist
INVESTMENTS_FILE="docs/database/migration_add_investments.sql"
ASSETS_FILE="docs/database/migration_add_assets.sql"

if [ ! -f "$INVESTMENTS_FILE" ]; then
    echo "❌ Error: Investments migration file not found"
    exit 1
fi

if [ ! -f "$ASSETS_FILE" ]; then
    echo "❌ Error: Assets migration file not found"
    exit 1
fi

echo "✅ Migration files found"
echo ""

# Get Supabase URL
if [ -f ".env.local" ]; then
    source .env.local
    SUPABASE_URL=$VITE_SUPABASE_URL
    echo "📍 Supabase URL: $SUPABASE_URL"
else
    echo "❌ Error: .env.local file not found"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 MIGRATION OPTIONS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option 1: Run via Supabase SQL Editor (Recommended)"
echo "  1. Go to Supabase SQL Editor"
echo "  2. Copy migration file contents"
echo "  3. Paste and run in SQL Editor"
echo ""
echo "Option 2: Run via psql command line"
echo "  Requirements: psql installed, DATABASE_URL configured"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Which option do you want to use? (1/2/skip): " choice

case $choice in
    1)
        echo ""
        echo "📋 Running migrations via Supabase SQL Editor..."
        echo ""
        
        # Investments Migration
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📈 STEP 1: INVESTMENTS MIGRATION"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Open SQL Editor:"
        echo "   https://supabase.com/dashboard/project/ojfgcaguzglozcwvxfoa/sql/new"
        echo ""
        echo "2. Open migration file:"
        echo "   $INVESTMENTS_FILE"
        echo ""
        echo "3. Copy ALL contents and paste into SQL Editor"
        echo ""
        echo "4. Click 'Run' button"
        echo ""
        
        # Try to open file
        if command -v xdg-open &> /dev/null; then
            xdg-open "$INVESTMENTS_FILE" 2>/dev/null
        fi
        
        read -p "Press ENTER after running Investments migration..."
        
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🏠 STEP 2: ASSETS MIGRATION"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Open new SQL Editor tab"
        echo ""
        echo "2. Open migration file:"
        echo "   $ASSETS_FILE"
        echo ""
        echo "3. Copy ALL contents and paste into SQL Editor"
        echo ""
        echo "4. Click 'Run' button"
        echo ""
        
        # Try to open file
        if command -v xdg-open &> /dev/null; then
            xdg-open "$ASSETS_FILE" 2>/dev/null
        fi
        
        read -p "Press ENTER after running Assets migration..."
        ;;
        
    2)
        echo ""
        if [ -z "$DATABASE_URL" ]; then
            echo "❌ Error: DATABASE_URL not set"
            echo ""
            echo "Set DATABASE_URL and try again:"
            echo "export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.ojfgcaguzglozcwvxfoa.supabase.co:5432/postgres'"
            exit 1
        fi
        
        echo "🔄 Running Investments migration..."
        psql "$DATABASE_URL" -f "$INVESTMENTS_FILE"
        
        if [ $? -eq 0 ]; then
            echo "✅ Investments migration completed"
        else
            echo "❌ Investments migration failed"
            exit 1
        fi
        
        echo ""
        echo "🔄 Running Assets migration..."
        psql "$DATABASE_URL" -f "$ASSETS_FILE"
        
        if [ $? -eq 0 ]; then
            echo "✅ Assets migration completed"
        else
            echo "❌ Assets migration failed"
            exit 1
        fi
        ;;
        
    *)
        echo ""
        echo "⏭️  Skipping migrations"
        echo ""
        echo "Run manually later with:"
        echo "  ./scripts/run-investments-assets-migration.sh"
        exit 0
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Run this in Supabase SQL Editor to verify:"
echo ""
echo "SELECT table_name FROM information_schema.tables"
echo "WHERE table_schema='public'"
echo "AND table_name IN ('investments', 'assets');"
echo ""
echo "Expected: 2 rows (both tables should be listed)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✨ Next steps:"
echo ""
echo "  1. Verify tables created (run query above)"
echo "  2. Start dev server: npm run dev"
echo "  3. Test Investments: http://localhost:5173/investments"
echo "  4. Test Assets: http://localhost:5173/assets"
echo ""
echo "📚 Documentation:"
echo "  - Quick Start: docs/guides/INVESTMENTS_ASSETS_QUICK_START.md"
echo "  - User Guide: docs/guides/INVESTMENTS_USER_GUIDE.md"
echo "  - Assets Guide: docs/guides/ASSETS_USER_GUIDE.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Migration script complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
