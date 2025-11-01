#!/bin/bash

# Security Database Migration Script
# This script runs the security migration on your Supabase database

echo "🔐 Starting Security Database Migration..."
echo ""

# Check if migration file exists
MIGRATION_FILE="docs/database/migration_add_security.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found at $MIGRATION_FILE"
    exit 1
fi

echo "✅ Migration file found"
echo ""

# Get Supabase URL from .env.local
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
echo "  1. Go to: https://supabase.com/dashboard/project/ojfgcaguzglozcwvxfoa/sql/new"
echo "  2. Copy contents from: $MIGRATION_FILE"
echo "  3. Paste into SQL Editor"
echo "  4. Click 'Run' button"
echo ""
echo "Option 2: Run via psql command line"
echo "  Requirements: psql installed, DATABASE_URL configured"
echo "  Command: psql \$DATABASE_URL -f $MIGRATION_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ask user which option
read -p "Which option do you want to use? (1/2/skip): " choice

case $choice in
    1)
        echo ""
        echo "📋 Opening Supabase SQL Editor..."
        echo ""
        echo "1. SQL Editor URL: https://supabase.com/dashboard/project/ojfgcaguzglozcwvxfoa/sql/new"
        echo "2. Migration file: $MIGRATION_FILE"
        echo ""
        echo "Copy the file contents and paste into SQL Editor, then click Run."
        
        # Try to open file in default text editor for easy copying
        if command -v xdg-open &> /dev/null; then
            xdg-open "$MIGRATION_FILE"
        fi
        
        # Try to open URL in browser
        if command -v xdg-open &> /dev/null; then
            xdg-open "https://supabase.com/dashboard/project/ojfgcaguzglozcwvxfoa/sql/new"
        fi
        ;;
    2)
        echo ""
        if [ -z "$DATABASE_URL" ]; then
            echo "❌ Error: DATABASE_URL not set"
            echo "Please set DATABASE_URL environment variable with your PostgreSQL connection string"
            echo ""
            echo "Example:"
            echo "export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.ojfgcaguzglozcwvxfoa.supabase.co:5432/postgres'"
            exit 1
        fi
        
        echo "🔄 Running migration via psql..."
        psql "$DATABASE_URL" -f "$MIGRATION_FILE"
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Migration completed successfully!"
        else
            echo ""
            echo "❌ Migration failed. Please check the error messages above."
            exit 1
        fi
        ;;
    *)
        echo ""
        echo "⏭️  Skipping migration. You can run it manually later."
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VERIFICATION QUERY:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Run this in Supabase SQL Editor to verify migration:"
echo ""
echo "SELECT table_name FROM information_schema.tables"
echo "WHERE table_schema='public'"
echo "AND table_name IN ('user_security_settings', 'security_audit_log', 'cloud_backup_settings');"
echo ""
echo "Expected output: 3 rows (all three tables should be listed)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Next steps:"
echo "  1. Verify migration created 3 tables"
echo "  2. Start your development server: npm run dev"
echo "  3. Navigate to /security to configure security settings"
echo "  4. Test PIN protection, biometric auth, and auto-logout"
echo ""
echo "📚 Documentation:"
echo "  - Quick Start: docs/guides/SECURITY_QUICK_START.md"
echo "  - User Guide: docs/guides/SECURITY_USER_GUIDE.md"
echo "  - Technical: docs/guides/SECURITY_TECHNICAL.md"
echo ""
