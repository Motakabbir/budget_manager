# Recurring Transactions - User Guide

## Overview

The Recurring Transactions module allows you to automate repetitive income and expense entries in your budget manager. Set up templates for recurring transactions like salaries, rent, subscriptions, and bills, and let the system automatically create them at the right intervals.

## Key Features

- ✅ **6 Frequency Types**: Daily, Weekly, Bi-weekly, Monthly, Quarterly, Yearly
- ✅ **Automatic Creation**: Transactions are automatically created when due
- ✅ **Manual Triggers**: Process due transactions manually anytime
- ✅ **Smart Scheduling**: Set start dates, end dates, and track next occurrence
- ✅ **Activate/Deactivate**: Pause and resume recurring transactions without deleting
- ✅ **Upcoming Preview**: See what's coming in the next 7 days
- ✅ **Rich Statistics**: Track monthly recurring income, expenses, and net cash flow

---

## Getting Started

### Accessing Recurring Transactions

1. Navigate to **Recurring** in the sidebar (look for the 🔄 RefreshCw icon)
2. You'll see the main dashboard with 4 tabs:
   - **Active**: Currently running recurring transactions
   - **Inactive**: Paused recurring transactions
   - **Income**: All income templates
   - **Expense**: All expense templates

---

## Creating a Recurring Transaction

### Step 1: Click "Add Recurring"

Click the **"+ Add Recurring"** button in the top-right corner.

### Step 2: Fill Out the Form

**Required Fields:**
- **Type**: Income or Expense
- **Category**: Select from your existing categories (filtered by type)
- **Amount**: The transaction amount
- **Frequency**: Choose from:
  - **Daily** - Every day (e.g., daily allowance)
  - **Weekly** - Every 7 days (e.g., weekly paycheck)
  - **Bi-weekly** - Every 14 days (e.g., bi-weekly salary)
  - **Monthly** - Every month on the same day (e.g., rent, subscriptions)
  - **Quarterly** - Every 3 months (e.g., quarterly taxes)
  - **Yearly** - Every 12 months (e.g., annual insurance)
- **Start Date**: When the recurring should begin

**Optional Fields:**
- **Description**: Additional notes about the transaction
- **End Date**: When the recurring should stop (leave empty for indefinite)

### Step 3: Review Next Occurrence

The form automatically calculates and shows the **next transaction date** based on your frequency selection.

### Step 4: Create

Click **"Create Recurring"** to save your template.

---

## Managing Recurring Transactions

### Viewing Details

Each recurring transaction card displays:
- **Amount** (color-coded: green for income, red for expenses)
- **Category** with colored indicator
- **Frequency** with icon
- **Next Occurrence** date
- **Status** (Active/Inactive)
- **Upcoming Transactions**: Preview of next 3 occurrences

### Editing a Recurring Transaction

1. Click the **⋮** (three dots) menu on any recurring card
2. Select **"Edit"**
3. Modify any fields (type, category, amount, frequency, dates)
4. Click **"Save Changes"**

**Note**: Editing a recurring transaction does NOT affect already-created transactions—only future ones.

### Activating/Deactivating

**To Pause a Recurring:**
1. Click the **⋮** menu
2. Select **"Deactivate"**
3. The recurring will stop creating transactions but remain in your list

**To Resume a Recurring:**
1. Click the **⋮** menu on an inactive recurring
2. Select **"Activate"**
3. Transactions will resume at the next scheduled occurrence

### Executing Immediately

Want to create the next transaction right now without waiting?

1. Click the **⋮** menu
2. Select **"Execute Now"**
3. Confirm the action
4. A transaction is created immediately, and the next occurrence is updated

### Deleting a Recurring Transaction

1. Click the **⋮** menu
2. Select **"Delete"**
3. Confirm the deletion

**Warning**: This removes the template permanently. Already-created transactions remain unchanged.

---

## Automatic Processing

### How It Works

The system automatically checks for due recurring transactions when:
- ✅ You log into the app
- ✅ You navigate to the Recurring Transactions page
- ✅ You click the **"Process Due Now"** button

**Processing Logic:**
- Checks all **active** recurring transactions
- Identifies those where `next_occurrence <= today`
- Creates a transaction for each due recurring
- Updates the `next_occurrence` date based on frequency
- Auto-deactivates recurring that have passed their `end_date`

### Manual Processing

If you want to manually trigger the check:

1. Go to the **Recurring Transactions** page
2. Click the **"▶ Process Due Now"** button in the header
3. The system will:
   - Process all due transactions
   - Show a success toast: "X recurring transactions created"
   - Refresh the page data automatically

---

## Understanding Frequencies

### Calculation Examples

| Frequency | Interval | Example Start | Next Occurrence |
|-----------|----------|---------------|-----------------|
| Daily | 1 day | Jan 15 | Jan 16 |
| Weekly | 7 days | Jan 15 (Mon) | Jan 22 (Mon) |
| Bi-weekly | 14 days | Jan 15 | Jan 29 |
| Monthly | 1 month | Jan 15 | Feb 15 |
| Quarterly | 3 months | Jan 15 | Apr 15 |
| Yearly | 12 months | Jan 15, 2024 | Jan 15, 2025 |

### Monthly Equivalents

When viewing statistics, the system calculates monthly equivalents:

- **Daily**: Amount × 30
- **Weekly**: Amount × 4.33
- **Bi-weekly**: Amount × 2.17
- **Monthly**: Amount × 1
- **Quarterly**: Amount × 0.33
- **Yearly**: Amount × 0.08

**Example**: A $100 weekly recurring = $433/month in statistics.

---

## Statistics Dashboard

### 4 Key Metrics

1. **Monthly Recurring Income**: Total expected income per month from all active recurring
2. **Monthly Recurring Expenses**: Total expected expenses per month from all active recurring
3. **Net Monthly Cash Flow**: Income minus Expenses (color-coded: green if positive, red if negative)
4. **Upcoming Transactions (7 days)**: Number of transactions scheduled in the next week

### Upcoming Transactions Banner

At the top of the page, see all transactions due in the **next 7 days** with:
- Description
- Amount
- Next occurrence date

---

## Common Use Cases

### 1. Monthly Salary

- **Type**: Income
- **Category**: Salary
- **Amount**: $5,000
- **Frequency**: Monthly
- **Start Date**: 1st of each month
- **End Date**: Leave empty

### 2. Rent Payment

- **Type**: Expense
- **Category**: Housing
- **Amount**: $1,500
- **Frequency**: Monthly
- **Start Date**: 1st of each month
- **End Date**: Lease end date

### 3. Netflix Subscription

- **Type**: Expense
- **Category**: Entertainment
- **Amount**: $15.99
- **Frequency**: Monthly
- **Start Date**: Subscription start date
- **End Date**: Leave empty (or set if canceling)

### 4. Bi-weekly Paycheck

- **Type**: Income
- **Category**: Salary
- **Amount**: $2,000
- **Frequency**: Bi-weekly
- **Start Date**: First paycheck date
- **End Date**: Leave empty

### 5. Quarterly Taxes

- **Type**: Expense
- **Category**: Taxes
- **Amount**: $3,000
- **Frequency**: Quarterly
- **Start Date**: First tax payment date
- **End Date**: Leave empty

### 6. Annual Insurance

- **Type**: Expense
- **Category**: Insurance
- **Amount**: $1,200
- **Frequency**: Yearly
- **Start Date**: Policy renewal date
- **End Date**: Leave empty

---

## Tips & Best Practices

### 1. Set End Dates for Fixed-Term Recurring

If you know when a recurring should stop (e.g., loan payments, fixed subscriptions), set an end date. The system will auto-deactivate it when complete.

### 2. Use Descriptions for Context

Add descriptions like "Netflix Premium Plan" or "Car Loan Payment #12" to help identify transactions later.

### 3. Review Upcoming Transactions

Check the **"Upcoming Transactions (7 days)"** banner regularly to see what's coming and adjust your budget accordingly.

### 4. Deactivate Instead of Delete

If you're temporarily stopping a recurring (e.g., gym membership on hold), use **Deactivate** instead of Delete. You can easily reactivate it later.

### 5. Monitor Monthly Statistics

Use the statistics cards to understand your recurring financial commitments and ensure you have enough income to cover recurring expenses.

### 6. Execute Now for Missed Transactions

If the auto-processing missed a transaction (e.g., you were offline), use **"Execute Now"** to create it manually.

### 7. Check Transaction History

After a recurring processes, verify the created transaction in your **Expenses** or **Income** page to ensure accuracy.

---

## Troubleshooting

### Transaction Not Created Automatically

**Possible Causes:**
- Recurring is **inactive** (check status)
- `next_occurrence` date is in the future
- You haven't logged in since the due date
- End date has passed (check if auto-deactivated)

**Solution:**
- Activate the recurring if needed
- Click **"Process Due Now"** to manually trigger
- Use **"Execute Now"** to create immediately

### Wrong Next Occurrence Date

**Possible Causes:**
- Frequency changed but not recalculated
- Manual execution updated the schedule

**Solution:**
- Edit the recurring and verify the frequency
- Check the start date is correct
- The next occurrence recalculates automatically after each transaction

### Duplicate Transactions

**Possible Causes:**
- Clicking "Execute Now" multiple times
- Manual transaction created alongside automatic

**Solution:**
- Delete duplicate transactions from Expenses/Income page
- Wait for automatic processing instead of manual execution

### Statistics Don't Match Expectations

**Possible Causes:**
- Including inactive recurring in mental calculation
- Not accounting for monthly multipliers (e.g., weekly × 4.33)

**Solution:**
- Only active recurring count toward statistics
- Review the monthly equivalent formula in this guide

---

## Keyboard Shortcuts

- **`A`**: Open "Add Recurring" dialog (when on Recurring page)
- **`Tab`**: Switch between Active/Inactive/Income/Expense tabs
- **`Esc`**: Close dialogs

---

## Mobile Responsiveness

The Recurring Transactions interface is fully responsive:
- **Desktop**: Grid view with 2-3 columns
- **Tablet**: Grid view with 2 columns
- **Mobile**: Single column list view

All features (add, edit, delete, execute) work seamlessly on mobile devices.

---

## Security & Privacy

- **Row-Level Security**: You can only see and manage your own recurring transactions
- **Authentication Required**: Must be logged in to access recurring features
- **Data Encryption**: All data stored securely in Supabase with encryption at rest
- **Audit Trail**: All created transactions link back to their recurring template (via `recurring_transaction_id`)

---

## FAQ

**Q: Can I edit a transaction that was created from a recurring?**  
A: Yes! Go to the Expenses or Income page and edit it like any normal transaction. Changes won't affect the recurring template.

**Q: What happens if I delete a recurring transaction?**  
A: The template is removed, but all previously created transactions remain in your history.

**Q: Can I have multiple recurring with the same category?**  
A: Absolutely! For example, you can have multiple subscription expenses in the "Entertainment" category.

**Q: How does the system handle months with different days (e.g., 30 vs 31)?**  
A: The system uses date-fns library for smart date math. If you set a monthly recurring on Jan 31, it will create on the last day of each month (Feb 28/29, Mar 31, etc.).

**Q: Can I create a recurring that starts in the future?**  
A: Yes! Set the start date to any future date. The first transaction will be created on that date.

**Q: What if I want to skip one occurrence?**  
A: Deactivate the recurring before the due date, then reactivate it after. Or let it create automatically and delete the single transaction from your Expenses/Income page.

**Q: How do I see all transactions created from a specific recurring?**  
A: Currently, you can filter transactions by category and date range on the Expenses/Income pages. A future feature may add direct linking.

---

## Related Features

- **Categories**: Manage categories for better organization of recurring transactions
- **Expenses**: View all expense transactions (including those created from recurring)
- **Income**: View all income transactions (including those created from recurring)
- **Dashboard**: See overall financial health including recurring commitments

---

## Need Help?

If you encounter issues or have questions:
1. Check the **Troubleshooting** section above
2. Review the **FAQ** for common questions
3. Refer to the **Technical Documentation** for implementation details

---

**Last Updated**: October 31, 2025  
**Version**: 1.0.0  
**Module**: Recurring Transactions
