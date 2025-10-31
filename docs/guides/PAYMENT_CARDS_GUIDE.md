# Payment Cards Feature Guide

## Overview

The Payment Cards feature enables you to manage both **credit cards** and **debit cards**, track credit card balances and payments, monitor credit utilization, and link debit cards to bank accounts. This comprehensive guide covers everything you need to know about using payment cards in your budget management system.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Features Overview](#features-overview)
3. [Credit Cards Management](#credit-cards-management)
4. [Debit Cards Management](#debit-cards-management)
5. [Making Card Payments](#making-card-payments)
6. [Payment History](#payment-history)
7. [Transaction Integration](#transaction-integration)
8. [Best Practices](#best-practices)
9. [Technical Details](#technical-details)

---

## Quick Start

### Step 1: Run the Database Migration

Before using the payment cards feature, run the migration:

```bash
# Navigate to your project
cd /path/to/budget_manager

# Run the migration in your Supabase SQL editor or via CLI
psql -h your-supabase-host -U postgres -d postgres -f docs/database/migration_add_payment_cards.sql
```

### Step 2: Add Your First Card

1. Navigate to **Cards** in the sidebar
2. Click **Add Card** button
3. Fill in the card details:
   - Card name (e.g., "Chase Sapphire")
   - Card type (Credit or Debit)
   - Card network (Visa, Mastercard, etc.)
   - Last 4 digits
   - For credit cards: credit limit, current balance, APR
   - For debit cards: optionally link to a bank account
4. Choose a color for easy identification
5. Click **Add Card**

### Step 3: Use Your Card for Transactions

When adding an expense:
1. Go to **Expenses** page
2. Click **Add Expense**
3. Select **Payment Method** → "Credit/Debit Card"
4. Choose your card from the dropdown
5. Complete the transaction

---

## Features Overview

### ✅ Credit Card Features
- Track credit limit and current balance
- Monitor available credit in real-time
- Credit utilization percentage with color-coded alerts
- Interest rate (APR) tracking
- Billing cycle and payment due date management
- Minimum payment calculation
- Payment history with bank account deduction
- Expiry date tracking with warnings

### ✅ Debit Card Features
- Link to bank accounts
- Track card details (network, last 4 digits)
- Expiry date management
- Transaction tracking via linked account

### ✅ Dashboard & Analytics
- Total credit balance across all cards
- Total available credit
- Average credit utilization
- Monthly payment totals
- High utilization warnings (>80%)
- Payment history timeline

---

## Credit Cards Management

### Adding a Credit Card

**Required Fields:**
- **Card Name**: Descriptive name (e.g., "Amex Gold", "Capital One Venture")
- **Card Type**: Select "Credit Card"
- **Credit Limit**: Maximum credit line ($)

**Optional Fields:**
- **Card Network**: Visa, Mastercard, Amex, Discover, etc.
- **Last 4 Digits**: Last four digits of card number
- **Current Balance**: Outstanding balance
- **APR (%)**: Annual Percentage Rate
- **Billing Cycle Day**: Day of month when billing cycle starts (1-31)
- **Payment Due Day**: Day of month when payment is due (1-31)
- **Minimum Payment %**: Percentage of balance for minimum payment (default: 2%)
- **Expiry Date**: Card expiration date
- **Cardholder Name**: Name on the card
- **Color**: Visual identifier color
- **Notes**: Additional information

### Credit Card Display

Each credit card shows:
- **Current Balance**: Outstanding balance owed
- **Credit Limit**: Maximum credit line
- **Available Credit**: Remaining credit (Limit - Balance)
- **Utilization Bar**: Visual representation with color coding:
  - 🟢 Green: 0-50% utilization (healthy)
  - 🟠 Orange: 50-80% utilization (caution)
  - 🔴 Red: 80-100% utilization (high risk)
- **APR**: Interest rate
- **Billing Info**: Billing cycle day and payment due day

### Credit Utilization

**What is Credit Utilization?**
Credit utilization is the percentage of your credit limit that you're currently using:

```
Utilization = (Current Balance / Credit Limit) × 100
```

**Recommended Levels:**
- ✅ **0-30%**: Excellent - Optimal for credit score
- ⚠️ **30-50%**: Good - Monitor spending
- ⚠️ **50-80%**: Fair - Consider paying down balance
- 🚨 **80-100%**: High - Take action immediately

**High Utilization Alert:**
The dashboard displays a warning when any card exceeds 80% utilization, showing which cards need attention.

### Making Credit Card Payments

1. **From Cards Page:**
   - Click the **⋮** menu on a credit card
   - Select **Make Payment**

2. **Payment Dialog:**
   - **Current Balance**: Shows how much you owe
   - **Available Credit**: Shows remaining credit
   - **Minimum Payment**: Calculated based on your minimum payment percentage

3. **Quick Payment Buttons:**
   - **Minimum**: Pay the minimum amount (e.g., 2% of balance)
   - **Half Balance**: Pay 50% of balance
   - **Full Balance**: Pay entire balance (recommended!)

4. **Payment Details:**
   - **Payment Amount**: Enter custom amount or use quick buttons
   - **Payment Method**: Choose how you're paying
     - **Bank Transfer**: Deduct from your bank account (automatic)
     - **Cash**: Manual cash payment
     - **Check**: Payment by check
     - **Other**: Other payment method
   - **From Account** (if Bank Transfer): Select which account to deduct from
   - **Notes**: Add payment details

5. **What Happens:**
   - Credit card balance is **reduced** by payment amount
   - Available credit **increases**
   - If paying from bank account: account balance is **deducted**
   - Payment is recorded in payment history
   - Utilization percentage updates automatically

### Credit Card Best Practices

1. **Pay in Full Monthly**: Avoid interest charges
2. **Monitor Utilization**: Keep below 30% for optimal credit health
3. **Set Up Reminders**: Use billing and due date fields
4. **Track APR**: Know your interest rates
5. **Update Balance Regularly**: Keep current balance accurate
6. **Watch Expiry Dates**: Renew before expiration

---

## Debit Cards Management

### Adding a Debit Card

**Required Fields:**
- **Card Name**: Descriptive name (e.g., "Wells Fargo Debit")
- **Card Type**: Select "Debit Card"

**Optional Fields:**
- **Card Network**: Visa, Mastercard, etc.
- **Last 4 Digits**: Last four digits of card number
- **Linked Bank Account**: Choose from your bank accounts
- **Expiry Date**: Card expiration date
- **Cardholder Name**: Name on the card
- **Color**: Visual identifier color
- **Notes**: Additional information

### Debit Card Features

- **No Balance Tracking**: Debit cards draw from linked bank account
- **Account Linking**: Connect to a bank account for balance reference
- **Transaction Tracking**: When used for expenses, transactions link to the card
- **Simple Management**: Basic card details for reference

### Using Debit Cards

**For Transactions:**
1. When adding an expense, select "Credit/Debit Card" as payment method
2. Choose your debit card
3. Transaction is recorded with card reference
4. If linked to bank account, you can track the account balance separately

---

## Making Card Payments

### Payment Methods Explained

**1. Bank Transfer (Recommended for Credit Cards)**
- Automatically deducts from selected bank account
- Updates both card balance and account balance
- Maintains accurate financial records
- Instant reconciliation

**2. Cash**
- Records payment without bank account deduction
- Use when paying with physical cash
- Manual balance tracking

**3. Check**
- Records check payments
- Add check number in notes
- Manual tracking

**4. Other**
- For alternative payment methods
- Use notes field for details

### Payment Process Flow

```
1. Select Credit Card → Make Payment
2. Choose Payment Amount (minimum, half, full, or custom)
3. Select Payment Method
4. If Bank Transfer: Choose bank account
5. Add optional notes
6. Submit Payment
   ↓
7. Card balance decreases
8. Available credit increases  
9. Bank account balance decreases (if bank transfer)
10. Payment recorded in history
11. Utilization recalculated
```

### Viewing Payment History

**Access Payment History:**
- Navigate to **Cards** page
- Click the **Payment History** tab

**Payment Record Details:**
- Payment date and time
- Card name
- Payment amount
- Payment method
- Bank account (if applicable)
- Notes

---

## Transaction Integration

### Using Cards for Expenses

When adding or editing expenses, you can specify payment method:

**Step-by-Step:**
1. Go to **Expenses** page
2. Click **Add Expense**
3. Fill in basic details (category, amount, date)
4. **Payment Method** dropdown:
   - **Cash**: Simple cash transaction
   - **Credit/Debit Card**: Choose from your cards
   - **Bank Account**: Choose from your accounts
   - **Other**: Custom payment method

5. If "Credit/Debit Card" selected:
   - Dropdown appears with all active cards
   - Shows card name and last 4 digits
   - Empty state if no cards available

6. Submit the transaction

### Transaction Tracking Benefits

- **See payment source**: Know which card/account was used
- **Budget by payment method**: Analyze spending by payment type
- **Reconciliation**: Match transactions with card/account statements
- **Expense categorization**: Track card-specific spending patterns

---

## Best Practices

### Credit Card Management

1. **Regular Updates**
   - Update current balance after each statement
   - Review transactions monthly
   - Reconcile with bank statements

2. **Payment Strategy**
   - **Priority 1**: Pay cards with highest utilization first
   - **Priority 2**: Pay cards with highest interest rates
   - **Goal**: Keep utilization below 30%

3. **Alerts & Monitoring**
   - Check high utilization warnings
   - Monitor approaching expiry dates
   - Track payment due dates

4. **Financial Health**
   - Aim for 0% utilization monthly (pay in full)
   - Never exceed 50% utilization if possible
   - Use available credit wisely

### Debit Card Management

1. **Link to Bank Accounts**: Always link debit cards to corresponding accounts
2. **Update Expiry Dates**: Keep cards current
3. **Use for Tracking**: Even if balance is in bank account, linking helps with transaction categorization

### Organization Tips

1. **Naming Convention**: Use bank name + card type (e.g., "Chase Freedom Credit")
2. **Color Coding**: Use distinct colors for different card types/purposes
3. **Notes Field**: Add card benefits, rewards rate, or special features
4. **Regular Cleanup**: Archive or delete unused/closed cards

---

## Technical Details

### Database Schema

**payment_cards Table:**
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → auth.users)
- card_name: TEXT (Required)
- card_type: TEXT (credit/debit, Required)
- card_network: TEXT (Optional)
- last_four_digits: TEXT (Optional, 4 chars)
- bank_account_id: UUID (Foreign Key → bank_accounts, for debit cards)
- credit_limit: DECIMAL (For credit cards, Required)
- current_balance: DECIMAL (Default: 0)
- available_credit: DECIMAL (Auto-calculated via trigger)
- interest_rate: DECIMAL (APR percentage)
- billing_cycle_day: INTEGER (1-31)
- payment_due_day: INTEGER (1-31)
- minimum_payment_percent: DECIMAL (Default: 2.0)
- expiry_date: DATE
- cardholder_name: TEXT
- color: TEXT (Default: #6366f1)
- icon: TEXT (Default: CreditCard)
- is_active: BOOLEAN (Default: true)
- notes: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**card_payments Table:**
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → auth.users)
- card_id: UUID (Foreign Key → payment_cards, Required)
- payment_amount: DECIMAL (Required)
- payment_date: DATE (Default: today)
- payment_method: TEXT (bank_transfer/cash/check/etc.)
- from_account_id: UUID (Foreign Key → bank_accounts)
- notes: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**transactions Table (Extended):**
```sql
-- New columns added:
- card_id: UUID (Foreign Key → payment_cards)
- account_id: UUID (Foreign Key → bank_accounts)
- payment_method: TEXT (cash/card/bank_account/other)
```

### Database Functions

**1. make_card_payment()**
```sql
Purpose: Process credit card payment with bank account deduction
Parameters:
  - p_card_id: UUID
  - p_payment_amount: DECIMAL
  - p_from_account_id: UUID (optional)
  - p_payment_method: TEXT (optional)
  - p_payment_date: DATE (optional)
  - p_notes: TEXT (optional)

Process:
1. Validates card exists and is active
2. Validates payment amount > 0
3. If from_account provided: validates account balance
4. Reduces card current_balance
5. If from_account: deducts from bank account
6. Inserts payment record
7. Returns payment record

Trigger: Updates available_credit automatically
```

**2. charge_credit_card()**
```sql
Purpose: Charge an amount to a credit card
Parameters:
  - p_card_id: UUID
  - p_amount: DECIMAL

Process:
1. Validates card exists and is credit type
2. Checks available credit
3. Increases current_balance
4. Returns updated card

Trigger: Updates available_credit automatically
```

**3. calculate_available_credit() Trigger**
```sql
Purpose: Auto-calculate available credit
Fires: BEFORE INSERT OR UPDATE on payment_cards
Logic: available_credit = credit_limit - current_balance
```

### Row Level Security (RLS)

All tables enforce RLS:
- **payment_cards**: Users can only view/modify their own cards
- **card_payments**: Users can only view/modify their own payments
- **transactions**: Users can only view/modify their own transactions

### React Query Hooks

**Available Hooks:**
```typescript
// Fetch hooks
usePaymentCards()          // Get all user's cards
useCardPayments()          // Get all payment records

// Mutation hooks
useCreatePaymentCard()     // Add new card
useUpdatePaymentCard()     // Update card details
useDeletePaymentCard()     // Delete card
useMakeCardPayment()       // Process payment (uses DB function)
useDeleteCardPayment()     // Delete payment record
```

**Cache Invalidation:**
- Payment mutations invalidate: `paymentCards`, `cardPayments`, `bankAccounts` queries
- Ensures real-time updates across the app

### Components Architecture

```
src/components/payment-cards/
├── AddCardDialog.tsx          # Card creation form
├── CardItem.tsx               # Card display component
├── CardPaymentDialog.tsx      # Payment processing form
└── index.ts                   # Exports

src/pages/
└── CardsPage.tsx              # Main cards management page
    ├── Statistics Dashboard   # Overview of all cards
    ├── Credit Cards Tab       # Grid of credit cards
    ├── Debit Cards Tab        # Grid of debit cards
    └── Payment History Tab    # Chronological payment list
```

### State Management

**Global State (Zustand):**
- Payment cards CRUD methods
- Card payments CRUD methods
- Integration with existing store patterns

**Local State (React Query):**
- Data fetching and caching (5-minute staleTime)
- Optimistic updates
- Automatic refetching on window focus

---

## Troubleshooting

### Common Issues

**1. "No cards available" in expense form**
- **Solution**: Add cards first via Cards page
- Make sure cards are marked as "active"

**2. Payment not deducting from bank account**
- **Check**: Did you select "Bank Transfer" as payment method?
- **Check**: Did you select a bank account?
- **Check**: Does bank account have sufficient balance?

**3. Available credit not updating**
- **Solution**: The `calculate_available_credit()` trigger updates this automatically
- If still not working, check database trigger is installed correctly

**4. Card utilization shows incorrect percentage**
- **Check**: Current balance is accurate
- **Check**: Credit limit is correct
- **Formula**: (Current Balance / Credit Limit) × 100

**5. Migration errors**
- **Check**: Bank accounts migration ran first (payment_cards references bank_accounts)
- **Check**: No duplicate column names
- **Check**: Database user has proper permissions

### Getting Help

If you encounter issues:
1. Check browser console for errors
2. Verify database migration ran successfully
3. Check RLS policies are enabled
4. Ensure Supabase connection is active
5. Review the [Technical Documentation](#technical-details)

---

## Future Enhancements

Potential features for future versions:
- 📊 Spending analytics by card
- 🔔 Payment due date reminders
- 📈 Credit utilization trends
- 💳 Card rewards tracking
- 🎯 Payment goal setting
- 📱 Mobile app support
- 🔄 Automatic statement imports
- 📊 Credit score impact predictions

---

## Conclusion

The Payment Cards feature provides comprehensive credit and debit card management integrated seamlessly with your budget tracking system. By monitoring credit utilization, tracking payments, and linking cards to transactions, you gain complete visibility into your credit health and spending patterns.

**Key Takeaways:**
- ✅ Track unlimited credit and debit cards
- ✅ Monitor credit utilization in real-time
- ✅ Process payments with automatic bank account deduction
- ✅ Link cards to transactions for complete tracking
- ✅ View payment history and statistics
- ✅ Receive high utilization warnings

Start managing your payment cards today for better financial control!

---

**Document Version:** 1.0  
**Last Updated:** October 31, 2025  
**Feature Status:** ✅ Production Ready
