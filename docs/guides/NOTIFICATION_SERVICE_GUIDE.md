# Notification Service - Complete Guide

## Overview

The **Notification Service** is a comprehensive service layer for managing all notification operations in the Budget Manager application. It provides smart alert generation, batch operations, and seamless integration with the database.

**File**: `src/lib/services/notification.service.ts` (750+ lines)

---

## Table of Contents

1. [Core Functions](#core-functions)
2. [Smart Alert Generators](#smart-alert-generators)
3. [Batch Operations](#batch-operations)
4. [Integration Guide](#integration-guide)
5. [Usage Examples](#usage-examples)

---

## Core Functions

### Create Notification
```typescript
import { notificationService } from '@/lib/services/notification.service';

// Create a custom notification
const notification = await notificationService.create({
  type: 'system',
  title: 'Welcome!',
  message: 'Your account has been created successfully.',
  priority: 'normal',
  channel: 'in-app',
  metadata: { source: 'onboarding' }
});
```

### Fetch Notifications
```typescript
// Get all notifications
const allNotifications = await notificationService.getAll();

// Get unread notifications only
const unread = await notificationService.getAll({ is_read: false });

// Get high priority notifications
const urgent = await notificationService.getAll({ priority: 'urgent', limit: 10 });

// Get notifications by type
const budgetAlerts = await notificationService.getAll({ type: 'budget_exceeded' });
```

### Mark as Read
```typescript
// Mark single notification as read
await notificationService.markAsRead(notificationId);

// Mark all as read
await notificationService.markAllAsRead();
```

### Delete Notifications
```typescript
// Delete single notification
await notificationService.delete(notificationId);

// Delete all read notifications
await notificationService.deleteAllRead();
```

### Get Unread Count
```typescript
const unreadCount = await notificationService.getUnreadCount();
console.log(`You have ${unreadCount} unread notifications`);
```

---

## Smart Alert Generators

### 1. Low Balance Alert
```typescript
// Trigger when account balance is low
await notificationService.lowBalance(
  'Chase Checking',    // Account name
  45.50,               // Current balance
  100                  // Threshold (default: $100)
);
```

**Priority**:
- `urgent` if balance < $50
- `high` if balance < threshold

---

### 2. Budget Alerts

#### Budget Exceeded
```typescript
// Trigger when budget is exceeded
await notificationService.budgetExceeded(
  'Groceries',         // Category name
  520.75,              // Amount spent
  500                  // Budget limit
);
```

#### Budget Warning (80% threshold)
```typescript
// Trigger when 80% of budget is used
await notificationService.budgetWarning(
  'Entertainment',
  410.00,              // Current spending
  500                  // Budget limit
);
```

---

### 3. Unusual Spending Alert
```typescript
// Detect unusual spending patterns
await notificationService.unusualSpending(
  'Dining Out',        // Category
  450.00,              // Current amount
  200.00,              // Average amount
  125                  // Percentage over (125% more)
);
```

---

### 4. Bill Reminders

```typescript
// Create bill reminder (3 days, 1 day, or today)
const dueDate = new Date('2024-02-15');
const daysUntilDue = 1;

await notificationService.billReminder(
  'Internet Bill',
  79.99,
  dueDate,
  daysUntilDue
);
```

**Reminder Schedule**:
- 3 days before: `normal` priority, in-app
- 1 day before: `high` priority, email
- Day of: `urgent` priority, SMS

---

### 5. Credit Card Payment Reminder
```typescript
await notificationService.creditCardPayment(
  'Chase Sapphire',
  1250.00,             // Total amount
  new Date('2024-02-20'),
  35.00                // Minimum payment
);
```

---

### 6. Loan EMI Reminder
```typescript
await notificationService.loanEMI(
  'Home Loan',
  2150.00,             // EMI amount
  new Date('2024-02-01')
);
```

---

### 7. Subscription Renewal
```typescript
await notificationService.subscriptionRenewal(
  'Netflix Premium',
  19.99,
  new Date('2024-03-01')
);
```

---

### 8. Goal Milestone Alerts
```typescript
// Trigger at 25%, 50%, 75%, 100% completion
await notificationService.goalMilestone(
  'Emergency Fund',
  7500,                // Current amount
  10000,               // Target amount
  75                   // Percentage (75%)
);
```

**Milestones**: 25%, 50%, 75%, 100%

---

### 9. Spending Insights
```typescript
await notificationService.spendingInsight(
  'You spent 30% more on groceries this month compared to last month.',
  'Groceries',
  450.00
);
```

---

### 10. Weekly Summary
```typescript
await notificationService.weeklySummary(
  3500,                // Income
  2100,                // Expenses
  1400,                // Net (income - expenses)
  40                   // Savings rate %
);
```

---

### 11. Monthly Report
```typescript
await notificationService.monthlyReport(
  15000,               // Total income
  10500,               // Total expenses
  4500,                // Savings
  8.5                  // Net worth change %
);
```

---

## Batch Operations

### Check All Budget Alerts
```typescript
// Checks all active budgets and creates alerts for exceeded/warning budgets
await notificationService.checkAllBudgetAlerts();
```

**Use Case**: Run daily via cron job or after transactions

---

### Check Upcoming Bills
```typescript
// Checks all unpaid bills due within 3 days and creates reminders
await notificationService.checkUpcomingBills();
```

**Use Case**: Run daily at 9 AM

---

## Integration Guide

### 1. Transaction Hooks (Auto-trigger alerts)

**File**: `src/lib/hooks/use-transactions.ts`

```typescript
import { notificationService } from '@/lib/services/notification.service';

// In addTransaction mutation onSuccess:
onSuccess: async (newTransaction) => {
  // Check budget alerts
  await notificationService.checkAllBudgetAlerts();
  
  // Check low balance
  const account = accounts.find(a => a.id === newTransaction.account_id);
  if (account) {
    await notificationService.lowBalance(
      account.account_name,
      account.balance,
      100
    );
  }
  
  queryClient.invalidateQueries(['notifications']);
}
```

---

### 2. Budget Page (Real-time alerts)

**File**: `src/pages/BudgetsPage.tsx`

```typescript
import { notificationService } from '@/lib/services/notification.service';

// When budget is created/updated:
const handleSaveBudget = async (budget: Budget) => {
  await saveBudget(budget);
  
  // Check if budget needs alert
  const percentage = (budget.spent / budget.limit) * 100;
  if (percentage >= 80) {
    await notificationService.budgetWarning(
      budget.category_name,
      budget.spent,
      budget.limit
    );
  }
};
```

---

### 3. Daily Cron Job (Scheduled checks)

**Pseudocode** (would be implemented in backend):

```typescript
// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  await notificationService.checkUpcomingBills();
  await notificationService.checkAllBudgetAlerts();
});

// Run weekly on Sunday at 8 PM
cron.schedule('0 20 * * 0', async () => {
  // Generate weekly summaries for all users
  const users = await getActiveUsers();
  for (const user of users) {
    const stats = await getWeeklyStats(user.id);
    await notificationService.weeklySummary(
      stats.income,
      stats.expenses,
      stats.net,
      stats.savingsRate
    );
  }
});
```

---

### 4. Goal Progress Tracking

**File**: `src/pages/GoalsPage.tsx`

```typescript
import { notificationService } from '@/lib/services/notification.service';

// When goal progress is updated:
const handleContribution = async (goal: Goal, amount: number) => {
  const newCurrent = goal.current_amount + amount;
  const percentage = (newCurrent / goal.target_amount) * 100;
  
  // Check for milestone
  if ([25, 50, 75, 100].includes(Math.round(percentage))) {
    await notificationService.goalMilestone(
      goal.goal_name,
      newCurrent,
      goal.target_amount,
      Math.round(percentage)
    );
  }
};
```

---

## Usage Examples

### Example 1: Transaction Flow
```typescript
// After expense transaction:
async function afterExpenseAdded(transaction: Transaction) {
  // 1. Check budget status
  await notificationService.checkAllBudgetAlerts();
  
  // 2. Check for unusual spending
  const avgSpending = await getAverageSpending(transaction.category);
  if (transaction.amount > avgSpending * 1.5) {
    await notificationService.unusualSpending(
      transaction.category,
      transaction.amount,
      avgSpending,
      ((transaction.amount - avgSpending) / avgSpending) * 100
    );
  }
  
  // 3. Check account balance
  const account = await getAccount(transaction.account_id);
  await notificationService.lowBalance(account.name, account.balance);
}
```

---

### Example 2: Bill Management
```typescript
// When bill is created/updated:
async function setupBillReminders(bill: Bill) {
  const now = new Date();
  const dueDate = new Date(bill.due_date);
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue <= 3) {
    await notificationService.billReminder(
      bill.bill_name,
      bill.amount,
      dueDate,
      daysUntilDue
    );
  }
}
```

---

### Example 3: Dashboard Integration
```typescript
// Display notifications in dashboard:
import { notificationService } from '@/lib/services/notification.service';
import { useQuery } from '@tanstack/react-query';

function Dashboard() {
  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationService.getAll({ limit: 5 }),
  });
  
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  return (
    <div>
      <NotificationBadge count={unreadCount} />
      <NotificationList notifications={notifications} />
    </div>
  );
}
```

---

## Notification Types Reference

| Type | Priority | Channel | Use Case |
|------|----------|---------|----------|
| `budget_exceeded` | high | in-app | Budget limit exceeded |
| `budget_warning` | normal | in-app | 80%+ of budget used |
| `low_balance_warning` | urgent/high | in-app | Account balance low |
| `unusual_spending_detected` | high | in-app | Abnormal spending pattern |
| `bill_reminder_today` | urgent | SMS | Bill due today |
| `bill_reminder_1_day` | high | email | Bill due tomorrow |
| `bill_reminder_3_days` | normal | in-app | Bill due in 3 days |
| `credit_card_payment_due` | high | in-app | Credit card payment due |
| `loan_emi_reminder` | high | in-app | Loan EMI due |
| `subscription_renewal` | normal | email | Subscription renewing |
| `goal_milestone` | normal | in-app | Goal milestone reached |
| `goal_achieved` | high | in-app | Goal 100% completed |
| `spending_insight` | normal | in-app | AI-generated insight |
| `weekly_summary` | low | email | Weekly financial summary |
| `monthly_report` | normal | email | Monthly report |

---

## Priority Levels

- **urgent**: Immediate action required (red)
- **high**: Important, needs attention soon (orange)
- **normal**: Standard notification (blue)
- **low**: Informational only (gray)

---

## Channel Types

- **in-app**: Displayed in notification center
- **email**: Sent via email (future implementation)
- **sms**: Sent via SMS (future implementation)
- **push**: Browser push notification (future implementation)

---

## Best Practices

### 1. **Avoid Spam**
- Don't create duplicate notifications for the same event
- Use batch operations sparingly (once daily)
- Respect user preferences

### 2. **Meaningful Metadata**
- Store relevant context in `metadata` field
- Helps with filtering and analytics

### 3. **Error Handling**
```typescript
const notification = await notificationService.create({...});
if (!notification) {
  console.error('Failed to create notification');
  // Handle gracefully
}
```

### 4. **Invalidate Queries**
```typescript
await notificationService.markAsRead(id);
queryClient.invalidateQueries(['notifications']);
```

---

## Implementation Status

✅ **Completed**:
- Core CRUD operations
- 11 smart alert generators
- Batch operations
- TypeScript types
- Comprehensive documentation

⏳ **Pending**:
- Email/SMS channel implementation
- Scheduled job integration
- User preference filtering
- A/B testing for notification effectiveness

---

## Related Files

- `src/lib/hooks/use-notifications.ts` - React hooks
- `src/pages/NotificationsPage.tsx` - UI component
- `src/pages/NotificationPreferencesPage.tsx` - Settings page
- `docs/database/migration_enhanced_notifications.sql` - Database schema

---

## Troubleshooting

### Notifications not appearing?
1. Check database migration is run: `migration_enhanced_notifications.sql`
2. Verify user authentication: `supabase.auth.getUser()`
3. Check RLS policies are enabled

### Duplicate notifications?
- Implement duplicate detection before creating
- Use metadata to track notification history

### Performance issues?
- Use pagination for large notification lists
- Implement notification archival (delete old read notifications)
- Use indexes on frequently queried columns

---

## Support

For issues or questions:
- Check database logs for errors
- Review Supabase dashboard for RLS policy issues
- Test with `console.log()` in service functions

---

**Created**: 2024-01-XX  
**Last Updated**: 2024-01-XX  
**Version**: 1.0.0
