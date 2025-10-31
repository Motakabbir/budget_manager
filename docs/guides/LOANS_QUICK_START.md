# Loans Module - Quick Start Guide

Get up and running with the Loans feature in 5 minutes!

---

## Installation & Setup

### 1. Run Database Migration

```bash
# Navigate to your project directory
cd /media/dolar/office/projects/budget_manager

# Run the migration (if not already done)
# Using Supabase CLI:
supabase db push

# Or manually run the SQL file:
psql -d your_database < docs/database/migration_add_loans.sql
```

### 2. Verify Installation

The Loans menu item should appear in your sidebar automatically after migration.

✅ Look for the 💰 **HandCoins** icon labeled "Loans"

---

## Quick Actions

### Record a Loan You Gave (Lent Money)

1. Click **"Loans"** in sidebar
2. Click **"Add Loan"** button
3. Select **"Loan Given (Lent)"**
4. Enter:
   - Borrower's name: "John Doe"
   - Amount: $5,000
   - Interest rate: 5% (optional)
   - Start date: Today
5. Click **"Create Loan"**

### Record a Loan You Took (Borrowed Money)

1. Click **"Loans"** in sidebar
2. Click **"Add Loan"** button
3. Select **"Loan Taken (Borrowed)"**
4. Enter:
   - Lender's name: "Jane Smith"
   - Amount: $10,000
   - Interest rate: 3%
   - Start date: Today
5. Click **"Create Loan"**

### Process a Payment

#### Make a Payment (You're paying back)
1. Go to **"Loans Taken"** tab
2. Click the loan card
3. Click **"Make Payment"** button
4. Enter payment amount
5. Select bank account (optional)
6. Click **"Make Payment"**

#### Receive a Payment (Someone is paying you)
1. Go to **"Loans Given"** tab
2. Click the loan card
3. Click **"Receive Payment"** button
4. Enter payment amount
5. Select bank account (optional)
6. Click **"Receive Payment"**

---

## Common Scenarios

### Scenario 1: Interest-Free Loan

```
Loan Type: Given
Party Name: Sarah Johnson
Amount: $2,000
Interest Type: No Interest
Due Date: 2026-01-31
```

**Result:** Total = $2,000 (no interest added)

### Scenario 2: Simple Interest Loan

```
Loan Type: Taken
Party Name: ABC Bank
Amount: $50,000
Interest Type: Simple Interest
Interest Rate: 6%
Start Date: 2025-01-01
Due Date: 2027-01-01
```

**Calculation:**
- Years: 2
- Interest: $50,000 × 6% × 2 = $6,000
- Total: $56,000

### Scenario 3: Compound Interest Loan

```
Loan Type: Given
Party Name: Business Partner
Amount: $100,000
Interest Type: Compound Interest
Interest Rate: 8%
Start Date: 2025-01-01
Due Date: 2028-01-01
```

**Calculation:**
- Years: 3
- Total: $100,000 × (1.08)³ = $125,971

---

## Understanding Your Dashboard

### Statistics Cards

**Loans Given (Green)**
- Money owed TO you
- Outstanding amount to collect

**Loans Taken (Red)**
- Money you OWE others
- Outstanding amount to pay

**Net Position**
- Positive (Green): You're a net lender
- Negative (Red): You're a net borrower

**This Month Payments**
- Total payments processed
- Count of transactions

---

## Tabs Explained

### 1. Loans Given Tab
- Shows active loans you've lent
- Green cards with "Lent" badge
- Click to receive payments

### 2. Loans Taken Tab
- Shows active loans you've borrowed
- Red cards with "Borrowed" badge
- Click to make payments

### 3. Completed Tab
- Fully paid-off loans
- Read-only view
- Historical reference

### 4. Payment History Tab
- All payment transactions
- Principal/interest breakdown
- Receipt tracking

---

## Payment Flow

### Automatic Calculations

When you process a payment, the system automatically:

1. ✅ **Calculates Interest Portion**
   - Based on current balance and rate

2. ✅ **Calculates Principal Portion**
   - Remainder after interest

3. ✅ **Updates Outstanding Balance**
   - Reduces by payment amount

4. ✅ **Updates Bank Account**
   - Deducts (if paying) or adds (if receiving)

5. ✅ **Updates Progress Bar**
   - Visual tracking

6. ✅ **Changes Status**
   - To "Completed" when fully paid

---

## Tips for Success

### ✅ DO:
- Add loans immediately after agreement
- Link bank accounts for automatic tracking
- Set realistic due dates
- Record all payments promptly
- Keep notes and receipts
- Review overdue loans weekly

### ❌ DON'T:
- Skip documentation
- Forget to set interest rates
- Miss payment dates
- Lose receipt numbers
- Ignore overdue warnings

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Loans Page | Click sidebar or `/loans` URL |
| Add Loan | Click "Add Loan" button |
| Process Payment | Click loan card |
| Switch Tabs | Click tab headers |

---

## Troubleshooting

### Loan not appearing?
- Check you selected correct loan type (given/taken)
- Verify status filter (active vs completed)
- Refresh the page

### Payment not working?
- Ensure payment ≤ outstanding balance
- Verify bank account has sufficient funds
- Check payment amount is positive

### Interest calculation wrong?
- Verify interest type (simple vs compound)
- Check interest rate percentage
- Confirm start and due dates

### Can't delete loan?
- Confirm you want to delete (includes all payments)
- Ensure you're the loan owner
- Check for database errors in console

---

## Integration with Other Features

### Bank Accounts
- Link loans to specific accounts
- Automatic balance updates
- Transaction tracking

### Payment Cards
- Can link to debit cards
- Automatic payment deductions

### Transactions
- Loan payments can link to transactions
- `loan_id` field available

---

## Next Steps

1. **Read Full User Guide**: [LOANS_USER_GUIDE.md](./LOANS_USER_GUIDE.md)
2. **Review Technical Docs**: [LOANS_TECHNICAL.md](./LOANS_TECHNICAL.md)
3. **Explore Dashboard**: Try different loan scenarios
4. **Set Up Reminders**: Note important payment dates
5. **Link Bank Accounts**: For automatic tracking

---

## Quick Reference Card

```
┌─────────────────────────────────────────────┐
│          LOANS QUICK REFERENCE              │
├─────────────────────────────────────────────┤
│ LOAN TYPES:                                 │
│  • Given (Lent)  → You receive payments     │
│  • Taken (Borrowed) → You make payments     │
│                                             │
│ INTEREST TYPES:                             │
│  • None - No interest charged               │
│  • Simple - Principal × Rate × Time         │
│  • Compound - Principal × (1+Rate)^Time     │
│                                             │
│ STATUSES:                                   │
│  • Active - Ongoing with balance            │
│  • Completed - Fully paid off               │
│  • Defaulted - Payment obligations not met  │
│  • Cancelled - Loan was cancelled           │
│                                             │
│ PAYMENT FREQUENCIES:                        │
│  One-time, Daily, Weekly, Bi-Weekly,        │
│  Monthly, Quarterly, Semi-Annually, Yearly  │
└─────────────────────────────────────────────┘
```

---

## Example Workflow

### Complete Loan Lifecycle

**Step 1: Create Loan (Day 1)**
```
Type: Loan Given
Party: Mike Wilson
Amount: $20,000
Interest: 4% Simple
Start: Jan 1, 2025
Due: Jan 1, 2026
Frequency: Monthly
```

**Step 2: Receive First Payment (Month 1)**
```
Amount: $1,733.33
Principal: ~$1,666.67
Interest: ~$66.66
New Balance: $18,266.67
```

**Step 3: Track Progress**
- Check dashboard monthly
- Monitor overdue status
- Review payment history

**Step 4: Final Payment (Month 12)**
```
Amount: Remaining balance
Status: Changes to "Completed"
Moves to Completed tab
```

---

## Support

Need help? Check these resources:

1. **User Guide**: Comprehensive documentation
2. **Technical Docs**: Database and API details
3. **Payment History**: Review past transactions
4. **Loan Details**: Check individual loan cards

---

**Ready to get started?** Click the Loans icon in your sidebar and create your first loan!

🚀 Happy Lending & Borrowing!
