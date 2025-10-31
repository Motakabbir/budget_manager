# Payment Cards Quick Start Guide

Get started with payment cards management in under 5 minutes!

## Prerequisites

✅ Budget Manager application installed  
✅ Bank Accounts migration already run  
✅ Database access (Supabase)

---

## Step 1: Run Migration (2 minutes)

### Option A: Supabase Dashboard
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Copy contents of `docs/database/migration_add_payment_cards.sql`
4. Paste and click **Run**
5. ✅ Migration complete!

### Option B: Command Line
```bash
cd /path/to/budget_manager
psql -h your-supabase-host -U postgres -d postgres -f docs/database/migration_add_payment_cards.sql
```

---

## Step 2: Add Your First Card (1 minute)

### For Credit Card:
1. Click **Cards** in sidebar
2. Click **Add Card**
3. Fill in:
   - **Card Name**: "My Chase Card"
   - **Type**: Credit Card
   - **Credit Limit**: 5000
   - **Current Balance**: 1200 (if any)
4. Click **Add Card**

### For Debit Card:
1. Click **Cards** in sidebar
2. Click **Add Card**
3. Fill in:
   - **Card Name**: "My Debit Card"
   - **Type**: Debit Card
   - **Linked Account**: (select your bank account)
4. Click **Add Card**

---

## Step 3: Make Your First Payment (1 minute)

**For Credit Cards Only:**

1. Find your credit card
2. Click **⋮** menu → **Make Payment**
3. Choose amount:
   - Click **Full Balance** (recommended)
   - Or enter custom amount
4. Select **Payment Method**: Bank Transfer
5. Choose **From Account**: Your bank account
6. Click **Make Payment**

**Result:**
- ✅ Credit card balance reduced
- ✅ Bank account balance deducted
- ✅ Payment recorded in history

---

## Step 4: Use Card for Transactions (1 minute)

1. Go to **Expenses** page
2. Click **Add Expense**
3. Fill in amount and category
4. **Payment Method**: Select "Credit/Debit Card"
5. **Select Card**: Choose your card
6. Click **Add Expense**

**Now your expense is linked to the card!**

---

## Quick Reference

### Credit Card Formula
```
Available Credit = Credit Limit - Current Balance
Utilization = (Current Balance / Credit Limit) × 100
```

### Credit Utilization Goals
- 🟢 **0-30%**: Excellent
- 🟠 **30-50%**: Good  
- 🟡 **50-80%**: Fair
- 🔴 **80-100%**: High Risk

### Payment Quick Buttons
- **Minimum**: 2% of balance (default)
- **Half Balance**: 50% of balance
- **Full Balance**: Pay it all (best!)

---

## What's Next?

✅ **Add more cards** - Track all your credit and debit cards  
✅ **Set up billing dates** - Track payment due dates  
✅ **Monitor utilization** - Keep it below 30%  
✅ **View analytics** - Check dashboard statistics  
✅ **Link to transactions** - Use cards when adding expenses

---

## Common Tasks

### Update Card Balance
1. Go to **Cards** page
2. Click **⋮** on card → **Edit**
3. Update **Current Balance**
4. Click **Update Card**

### Check Payment History
1. Go to **Cards** page
2. Click **Payment History** tab
3. View all payments chronologically

### Disable a Card
1. Go to **Cards** page
2. Click **⋮** on card → **Edit**
3. Uncheck **Is Active**
4. Click **Update Card**

---

## Troubleshooting

**Can't see cards in expense form?**
→ Make sure cards are marked as "Active"

**Payment not deducting from bank?**
→ Use "Bank Transfer" method and select account

**Utilization not calculating?**
→ Check credit limit and current balance are set

---

## Need More Help?

📚 Full Guide: `docs/guides/PAYMENT_CARDS_GUIDE.md`  
🗄️ Technical Docs: See "Technical Details" section in full guide  
🐛 Issues: Check error console in browser

---

**You're all set! Start managing your payment cards! 🎉**
