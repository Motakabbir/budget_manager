# Budgets - Quick Start Guide

Get up and running with budget tracking in under 5 minutes!

---

## What You'll Build

By the end of this guide, you'll have:
- ✅ 3 monthly budgets set up
- ✅ Real-time spending tracking
- ✅ Automatic alerts enabled
- ✅ Dashboard widget showing status

**Time Required**: 5 minutes

---

## Prerequisites

Before starting, ensure you have:
- ✅ Active account (logged in)
- ✅ At least 3 expense categories created
- ✅ Some transactions recorded (optional, for testing)

---

## Step 1: Navigate to Budgets (30 seconds)

1. Click **"Budgets"** in the sidebar (📊 PieChart icon)
2. You'll see the Budgets page with an empty state

---

## Step 2: Create Your First Budget (2 minutes)

### Groceries Budget

1. Click **"+ Add Budget"** button
2. Fill out the form:
   - **Category**: Select "Groceries"
   - **Budget Amount**: Enter `500`
   - **Period**: Select "Monthly"
3. Click **"Create Budget"**

✅ Your first budget is created!

### Dining Out Budget

1. Click **"+ Add Budget"** again
2. Fill out:
   - **Category**: "Dining/Restaurants"
   - **Budget Amount**: `200`
   - **Period**: "Monthly"
3. Click **"Create Budget"**

### Entertainment Budget

1. Click **"+ Add Budget"** one more time
2. Fill out:
   - **Category**: "Entertainment"
   - **Budget Amount**: `150`
   - **Period**: "Monthly"
3. Click **"Create Budget"**

---

## Step 3: View Your Budgets (1 minute)

You should now see:

- **3 Budget Cards** in the Monthly tab
- Each showing:
  - Category name with color dot
  - Budget amount
  - Spent amount (probably $0 if no transactions)
  - Progress bar (green if no spending)
  - "On Track" status badge

### Statistics Cards

At the top, you'll see:
- **Monthly Budget**: $850 (500 + 200 + 150)
- **Total Spent**: $0 (or actual if you have transactions)
- **Remaining**: $850
- **Status Overview**: 3 safe budgets

---

## Step 4: Test Alert System (1 minute)

### Add Some Transactions

To see the alert system in action:

1. Go to **Expenses** page
2. Add a transaction:
   - **Amount**: $420
   - **Category**: Groceries
   - **Date**: Today
3. Return to **Budgets** page

### Observe Changes

You should now see:
- Groceries budget at **84%** (420/500)
- Status changed to **"Warning"** (yellow)
- Alert message: "Approaching limit"
- Progress bar is yellow
- **Sidebar badge** shows "1" in red

### Dashboard Integration

1. Navigate to **Dashboard**
2. Look for **BudgetAlertsWidget**
3. It should show:
   - "1 budget needs attention"
   - Groceries with 84% progress bar
   - "View All Budgets" button

---

## Step 5: Explore Features (30 seconds)

### Try the Tabs

- Click **"Warning"** tab → See Groceries budget
- Click **"Monthly"** tab → See all 3 budgets
- Click **"Yearly"** tab → Empty (no yearly budgets yet)
- Click **"Exceeded"** tab → Empty (no exceeded budgets)

### Edit a Budget

1. Click **⋮** menu on any budget card
2. Select **"Edit Budget"**
3. Change the amount (e.g., $600)
4. Click **"Save Changes"**

### Delete a Budget (Optional)

1. Click **⋮** menu
2. Select **"Delete Budget"**
3. Click again to confirm

---

## What's Next?

### Recommended Actions

**1. Set Up Annual Budgets (5 min)**
- Insurance: $1,200/year
- Property Taxes: $4,000/year
- Vacation: $3,000/year

**2. Review Weekly**
- Check dashboard widget daily
- Review full budgets page weekly
- Adjust amounts based on patterns

**3. Respond to Alerts**
- Warning (80%): Review spending, reduce if possible
- Exceeded (100%): Analyze overspend, adjust next month

**4. Optimize Categories**
- Split broad categories (e.g., Food → Groceries + Dining)
- Create specific budgets for problem areas
- Archive unused budgets

---

## Common First-Time Scenarios

### Scenario 1: Setting Monthly Household Budget

**Goal**: Track all regular monthly expenses

**Budgets to Create**:
```
Groceries:       $500  (Monthly)
Utilities:       $200  (Monthly)
Transportation:  $150  (Monthly)
Dining Out:      $200  (Monthly)
Entertainment:   $100  (Monthly)
Shopping:        $150  (Monthly)
Personal Care:    $80  (Monthly)
---
Total:         $1,380/month
```

**Setup Time**: 5 minutes

### Scenario 2: Setting Yearly Big Expenses

**Goal**: Track infrequent large expenses

**Budgets to Create**:
```
Car Insurance:     $1,200  (Yearly)
Home Insurance:      $800  (Yearly)
Property Taxes:    $4,000  (Yearly)
HOA Fees:          $1,200  (Yearly)
Vacation:          $3,000  (Yearly)
Gifts (Holidays):    $500  (Yearly)
---
Total:           $10,700/year
```

**Setup Time**: 5 minutes

### Scenario 3: Hybrid Approach (Recommended)

**Goal**: Track both regular and irregular expenses

**Monthly Budgets**:
- Groceries: $500
- Dining: $200
- Gas: $150
- Utilities: $200
- Entertainment: $100

**Yearly Budgets**:
- Insurance: $2,000
- Property Tax: $4,000
- Vacation: $3,000

**Total Tracking**:
- Monthly: $1,150/month = $13,800/year
- Yearly: $9,000/year
- **Combined: $22,800/year**

**Setup Time**: 7 minutes

---

## Quick Tips

### 💡 Tip 1: Start Conservative
Set budgets 10-15% lower than you think you need. Easier to increase than decrease.

### 💡 Tip 2: Use Dashboard Widget
Check the BudgetAlertsWidget daily for quick status. No need to open full Budgets page unless there's an alert.

### 💡 Tip 3: Monitor the Badge
The sidebar badge is your early warning system. Red badge = time to check budgets.

### 💡 Tip 4: Adjust Monthly
Don't set budgets and forget them. Review and adjust based on actual spending patterns.

### 💡 Tip 5: Category Matters
Budgets are only as good as your categorization. Take time to categorize transactions correctly.

---

## Troubleshooting

### "I don't see any spending"

**Possible Causes**:
- No transactions in current period
- Transactions in different category
- Transactions dated outside period

**Solution**:
1. Go to Expenses page
2. Verify transactions exist
3. Check category matches budget
4. Verify date is in current month/year

### "Alert showing repeatedly"

**Possible Causes**:
- First time loading after threshold
- localStorage cleared
- 24 hours passed since last alert

**Solution**:
- Normal behavior for first load
- Alerts reset after 24 hours
- Close toasts or wait for auto-dismiss (8 seconds)

### "Can't create budget"

**Possible Causes**:
- Category already has budget for that period
- Amount is zero or negative
- Category doesn't exist

**Solution**:
1. Check existing budgets for that category/period
2. Ensure amount > 0
3. Verify category exists in Categories page
4. Try different period (monthly vs yearly)

### "Budget not updating"

**Possible Causes**:
- Cache not refreshed
- Transaction not synced

**Solution**:
1. Refresh the page (F5)
2. Wait a few seconds for React Query cache
3. Check Network tab for errors

---

## Keyboard Shortcuts

**On Budgets Page**:
- `E` - Edit first budget
- `D` - Delete first budget  
- `Tab` - Navigate between tabs
- `Esc` - Close dialogs

---

## Next Steps

### Learn More

📖 **User Guide**: Read comprehensive feature documentation  
`docs/guides/BUDGETS_USER_GUIDE.md`

🔧 **Technical Docs**: Understand implementation details  
`docs/guides/BUDGETS_TECHNICAL.md`

### Related Features

- **Categories**: Manage and organize categories
- **Expenses**: View and track all expense transactions
- **Dashboard**: Monitor overall financial health
- **Recurring**: Set up automatic recurring expenses

---

## Success Checklist

After completing this guide, you should be able to:

- ✅ Create monthly budgets
- ✅ Create yearly budgets
- ✅ View spending progress
- ✅ Understand status indicators (safe/warning/exceeded)
- ✅ Edit and delete budgets
- ✅ See alerts in sidebar badge
- ✅ Monitor dashboard widget
- ✅ Navigate between tabs
- ✅ Interpret statistics cards

---

## Quick Reference Card

### Budget Status Colors

| Status | Color | Range | Action |
|--------|-------|-------|--------|
| Safe | 🟢 Green | 0-79% | Keep going! |
| Warning | 🟡 Yellow | 80-99% | Monitor closely |
| Exceeded | 🔴 Red | 100%+ | Review spending |

### Period Types

| Period | Resets | Best For |
|--------|--------|----------|
| Monthly | 1st of month | Regular expenses |
| Yearly | January 1st | Annual expenses |

### Alert Thresholds

| Threshold | Toast Type | Duration | Frequency |
|-----------|------------|----------|-----------|
| 80% | Warning ⚠️ | 6 sec | Once per 10% bracket |
| 100% | Error ❌ | 8 sec | Once per 10% bracket |

### Where to Find Budgets

| Location | Purpose |
|----------|---------|
| Sidebar → Budgets | Main page with all features |
| Dashboard → Widget | Quick overview |
| Sidebar → Badge | Alert count |
| Toast Notifications | Threshold alerts |

---

## Example Budget Setup (Copy & Paste)

### Young Professional

```
Monthly:
- Rent: $1,200
- Groceries: $300
- Dining: $150
- Transportation: $100
- Entertainment: $80
- Subscriptions: $50

Yearly:
- Car Insurance: $1,000
- Vacation: $2,000
```

### Family of Four

```
Monthly:
- Groceries: $800
- Utilities: $300
- Dining Out: $250
- Kids Activities: $200
- Gas: $200
- Entertainment: $100

Yearly:
- Insurance: $3,000
- Property Tax: $5,000
- Vacation: $4,000
- Holiday Gifts: $800
```

### College Student

```
Monthly:
- Food: $250
- Transportation: $50
- Entertainment: $80
- Personal Care: $40
- Books/Supplies: $100

Yearly:
- Tuition: $10,000
- Textbooks: $500
- Travel Home: $600
```

---

## Support

Need help? Check these resources:

1. **FAQ**: Common questions in User Guide
2. **Troubleshooting**: Solutions to common issues
3. **Technical Docs**: Implementation details
4. **Code**: Browse source code for advanced usage

---

## Congratulations! 🎉

You've successfully set up budget tracking! You're now ready to:
- Monitor your spending in real-time
- Receive automatic alerts
- Make informed financial decisions
- Stay in control of your budget

**Keep up the good work!** 💪

---

**Last Updated**: October 31, 2025  
**Version**: 1.0.0  
**Module**: Budgets  
**Estimated Completion Time**: 5 minutes
