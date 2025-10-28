# Budget Manager - Setup Instructions

## Complete Setup Guide

Follow these steps to get your Budget Manager application up and running.

## Step 1: Supabase Setup

### 1.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in the project details:
   - Project name: `budget-manager`
   - Database password: (choose a strong password)
   - Region: (choose closest to you)
5. Wait for the project to be created (1-2 minutes)

### 1.2 Get Your Supabase Credentials

1. In your Supabase project dashboard, click on "Project Settings" (gear icon)
2. Go to "API" section
3. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

### 1.3 Update Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 1.4 Set Up Database Schema

1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Open the file `lib/supabase/schema.sql` from your project
4. Copy all the SQL code from that file
5. Paste it into the Supabase SQL Editor
6. Click "Run" to execute the query
7. You should see a success message

This creates:

- `profiles` table (user information)
- `categories` table (income/expense categories)
- `transactions` table (financial transactions)
- `savings_goals` table (savings targets)
- All necessary indexes and security policies

## Step 2: Configure Authentication

### 2.1 Enable Email Authentication

1. In Supabase dashboard, go to "Authentication" > "Providers"
2. Make sure "Email" is enabled (it should be by default)
3. Optional: Configure email templates under "Email Templates"

### 2.2 Configure Site URL (for production)

1. Go to "Authentication" > "URL Configuration"
2. Add your production URL to "Site URL"
3. Add your production URL to "Redirect URLs"

## Step 3: Test Your Setup

### 3.1 Start the Development Server

```bash
npm run dev
```

### 3.2 Create Your First Account

1. Open [http://localhost:3000](http://localhost:3000)
2. You should be redirected to the auth page
3. Click on "Sign Up" tab
4. Create a new account with:
   - Full Name
   - Email
   - Password (minimum 6 characters)
5. Click "Sign Up"
6. You should see a success message

### 3.3 Sign In

1. Switch to "Sign In" tab
2. Enter your credentials
3. Click "Sign In"
4. You should be redirected to the dashboard

## Step 4: Add Sample Data

### 4.1 Create Categories

1. Go to "Categories" in the sidebar
2. Click "Add Category"
3. Create some income categories:
   - Salary (Income, blue color)
   - Freelance (Income, green color)
   - Investment (Income, purple color)
4. Create some expense categories:
   - Rent (Expense, red color)
   - Groceries (Expense, orange color)
   - Transportation (Expense, yellow color)
   - Entertainment (Expense, pink color)

### 4.2 Add Transactions

1. Go to "Income" page
2. Click "Add Income"
3. Add a few income transactions:
   - Select category
   - Enter amount
   - Choose date
   - Add description (optional)

4. Go to "Expenses" page
5. Click "Add Expense"
6. Add several expense transactions

### 4.3 Set Savings Goals

1. Go to "Settings" in the sidebar
2. Scroll to "Savings Goals" section
3. Click "Add Goal"
4. Create a goal:
   - Name: "Emergency Fund"
   - Target Amount: 10000
   - Deadline: 6 months from now
5. Click "Add Contribution" to track progress

### 4.4 View Dashboard

1. Go back to "Dashboard"
2. You should see:
   - Total balance
   - Income vs Expenses chart
   - Category breakdown pie chart
   - Balance trend over time

## Step 5: Explore Features

### Export Data

- Go to Income or Expenses page
- Click "Export CSV" to download your transactions

### Edit Transactions

- Click the pencil icon next to any transaction
- Modify details and save

### Delete Items

- Click the trash icon to delete categories, transactions, or goals
- Confirm the deletion

### Profile Settings

- Update your full name in Settings
- Change your password from Account Actions

## Troubleshooting

### Issue: "Cannot connect to Supabase"

**Solution:**

- Check that `.env.local` has correct values
- Restart the development server (`npm run dev`)
- Make sure your Supabase project is active

### Issue: "Database error" when signing up

**Solution:**

- Verify that you ran the schema.sql script in Supabase
- Check that all tables were created successfully
- Go to Supabase > Table Editor to verify

### Issue: "Row Level Security policy violation"

**Solution:**

- Make sure you ran the ENTIRE schema.sql file
- The file includes RLS policies that are required
- Check Supabase > Authentication > Policies

### Issue: Charts not showing data

**Solution:**

- Add at least 2-3 transactions in different months
- Refresh the dashboard page
- Check browser console for errors

### Issue: TypeScript errors

**Solution:**

- Run `npm install` again to ensure all dependencies are installed
- Restart VS Code
- Run `npm run build` to check for build errors

## Production Deployment

### Deploy to Vercel

1. Push your code to GitHub:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"
7. Wait for deployment to complete

8. Update Supabase URL configuration:
   - Go to Supabase > Authentication > URL Configuration
   - Add your Vercel URL to Site URL and Redirect URLs

## Database Backup

It's recommended to backup your Supabase database regularly:

1. Go to Supabase Dashboard
2. Navigate to "Database" > "Backups"
3. Enable automatic backups (paid plans)
4. Or manually export data using SQL Editor

## Security Best Practices

1. **Never commit `.env.local` to Git**
   - It's already in `.gitignore`

2. **Use strong passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols

3. **Enable 2FA on Supabase**
   - Go to Account Settings
   - Enable Two-Factor Authentication

4. **Regular updates**
   - Keep dependencies updated: `npm update`
   - Check for security alerts on GitHub

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Recharts Documentation](https://recharts.org)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Support

If you encounter issues not covered here:

1. Check the browser console for errors
2. Check Supabase logs in the dashboard
3. Review the GitHub repository issues
4. Create a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Error messages
   - Screenshots (if applicable)

---

Happy budgeting! 💰📊
