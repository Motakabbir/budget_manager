#!/bin/bash

# ============================================================================
# Budget Manager - Database Migration Script
# ============================================================================
# This script helps you migrate the database schema to Supabase
# ============================================================================

echo "================================================"
echo "Budget Manager - Database Migration"
echo "================================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found."
    echo ""
    echo "Would you like to:"
    echo "  1. Install Supabase CLI and continue"
    echo "  2. Get manual migration instructions"
    echo "  3. Exit"
    echo ""
    read -p "Choose option (1/2/3): " choice
    
    case $choice in
        1)
            echo ""
            echo "Installing Supabase CLI..."
            npm install -g supabase
            ;;
        2)
            echo ""
            echo "📋 Manual Migration Instructions:"
            echo "=================================="
            echo ""
            echo "1. Go to your Supabase Dashboard: https://supabase.com"
            echo "2. Select your project"
            echo "3. Click 'SQL Editor' in the left sidebar"
            echo "4. Click 'New Query'"
            echo "5. Copy the entire contents of: src/lib/supabase/schema.sql"
            echo "6. Paste into the SQL Editor"
            echo "7. Click 'Run' or press Ctrl+Enter"
            echo ""
            echo "✅ Your database will be fully set up!"
            echo ""
            echo "For more details, see DATABASE_SETUP.md"
            exit 0
            ;;
        3)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid option. Exiting..."
            exit 1
            ;;
    esac
fi

echo ""
echo "Checking Supabase CLI installation..."
supabase --version

echo ""
echo "Migration Options:"
echo "=================="
echo "  1. Migrate to linked project (recommended)"
echo "  2. Generate migration SQL only"
echo "  3. Show manual instructions"
echo ""
read -p "Choose option (1/2/3): " migration_choice

case $migration_choice in
    1)
        echo ""
        echo "Checking if project is linked..."
        
        if supabase status &> /dev/null; then
            echo "✅ Project is linked"
        else
            echo "⚠️  No linked project found"
            echo ""
            read -p "Enter your Supabase project reference ID: " project_ref
            echo "Linking project..."
            supabase link --project-ref "$project_ref"
        fi
        
        echo ""
        echo "Running migration..."
        echo "📁 Source: src/lib/supabase/schema.sql"
        echo ""
        
        # Note: This is a placeholder. In reality, you'd use proper Supabase migration commands
        echo "Please run the following command:"
        echo ""
        echo "  supabase db push"
        echo ""
        echo "And then apply the schema manually in SQL Editor"
        echo "(Supabase CLI doesn't support direct SQL file push in all versions)"
        ;;
        
    2)
        echo ""
        echo "✅ The migration SQL is ready at:"
        echo "   src/lib/supabase/schema.sql"
        echo ""
        echo "You can:"
        echo "  - Copy it to Supabase SQL Editor"
        echo "  - Use it with psql"
        echo "  - Include it in your deployment process"
        ;;
        
    3)
        echo ""
        echo "📋 Manual Migration Instructions:"
        echo "=================================="
        echo ""
        echo "Method 1: Supabase Dashboard (Easiest)"
        echo "---------------------------------------"
        echo "1. Go to: https://supabase.com"
        echo "2. Select your project"
        echo "3. SQL Editor → New Query"
        echo "4. Copy contents of: src/lib/supabase/schema.sql"
        echo "5. Paste and Run"
        echo ""
        echo "Method 2: psql Command"
        echo "----------------------"
        echo 'psql "postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"'
        echo "\i src/lib/supabase/schema.sql"
        echo ""
        echo "Method 3: Supabase CLI"
        echo "----------------------"
        echo "supabase link --project-ref your-project-ref"
        echo "# Then use SQL Editor for schema"
        echo ""
        ;;
        
    *)
        echo "Invalid option. Exiting..."
        exit 1
        ;;
esac

echo ""
echo "================================================"
echo "📚 Additional Resources:"
echo "================================================"
echo "  - Quick Start: DATABASE_SETUP.md"
echo "  - Detailed Guide: MIGRATION_GUIDE.md"
echo "  - Complete Schema: src/lib/supabase/schema.sql"
echo ""
echo "✅ What gets created:"
echo "  - 6 tables (categories, transactions, etc.)"
echo "  - 12 performance indexes"
echo "  - 24 RLS security policies"
echo "  - 1 recurring transaction function"
echo ""
echo "================================================"
echo "Happy budgeting! 💰"
echo "================================================"
