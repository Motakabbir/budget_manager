# Loans Module - User Guide

## Overview

The Loans module helps you track and manage money you've lent to others or borrowed from them. It provides a comprehensive system for recording loans, processing payments, calculating interest, and monitoring repayment progress.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding Loan Types](#understanding-loan-types)
3. [Creating a New Loan](#creating-a-new-loan)
4. [Managing Loans](#managing-loans)
5. [Processing Payments](#processing-payments)
6. [Interest Calculations](#interest-calculations)
7. [Payment History](#payment-history)
8. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### Accessing the Loans Page

1. Click **"Loans"** in the sidebar menu (💰 HandCoins icon)
2. Or navigate directly to `/loans` in your browser

### Dashboard Overview

When you open the Loans page, you'll see:

- **Statistics Cards**: Overview of your lending/borrowing position
  - **Loans Given**: Total outstanding amount owed to you
  - **Loans Taken**: Total outstanding amount you owe
  - **Net Position**: Your overall financial position (positive = more lent than borrowed)
  - **This Month Payments**: Total payments processed this month

- **Four Tabs**:
  - **Loans Given**: Money you've lent to others
  - **Loans Taken**: Money you've borrowed from others
  - **Completed**: Fully paid loans
  - **Payment History**: Detailed record of all payments

---

## Understanding Loan Types

### Loans Given (Lent Out)
- Money you've lent to someone
- You **receive** payments
- Appears in green (💚)
- Icon: Arrow pointing down-left
- You are the **Lender**

### Loans Taken (Borrowed)
- Money you've borrowed from someone
- You **make** payments
- Appears in red (❤️)
- Icon: Arrow pointing up-right
- You are the **Borrower**

---

## Creating a New Loan

### Step-by-Step Process

1. **Click "Add Loan"** button on the Loans page

2. **Select Loan Type**
   - **Loan Given (Lent)**: You lent money to someone
   - **Loan Taken (Borrowed)**: You borrowed money from someone

3. **Enter Party Details**
   - **Name** (Required): Full name of the person
   - **Contact** (Optional): Phone number or email

4. **Set Loan Amount**
   - **Principal Amount** (Required): The base amount lent/borrowed
   - Example: $5,000

5. **Configure Interest** (Optional)
   - **Interest Type**:
     - **No Interest**: Interest-free loan (0%)
     - **Simple Interest**: Interest calculated on principal only
     - **Compound Interest**: Interest calculated on principal + accumulated interest
   - **Interest Rate**: Annual percentage (e.g., 5.5%)

6. **Set Dates**
   - **Start Date** (Required): When the loan began
   - **Due Date** (Optional): Final repayment deadline
   - **Next Payment Date** (Optional): Upcoming payment date

7. **Choose Payment Frequency**
   - One-Time Payment
   - Daily, Weekly, Bi-Weekly
   - Monthly, Quarterly
   - Semi-Annually, Yearly

8. **Link Bank Account** (Optional)
   - Select a bank account for automatic tracking
   - Payments will deduct/credit this account

9. **Additional Information** (Optional)
   - **Purpose**: Reason for the loan (e.g., "Business expansion", "Medical emergency")
   - **Collateral**: Security/asset backing the loan (e.g., "Property deed", "Vehicle")
   - **Notes**: Any additional details

10. **Click "Create Loan"**

---

## Managing Loans

### Viewing Loan Details

Each loan card displays:

- **Party Name**: Who you lent to or borrowed from
- **Type Badge**: "Lent" (green) or "Borrowed" (red)
- **Status Badge**: Active, Completed, Defaulted, Cancelled
- **Overdue Badge**: Appears if past due date
- **Financial Summary**:
  - Principal Amount
  - Total Amount (with interest)
  - Outstanding Balance (orange)
  - Amount Paid (green)
- **Progress Bar**: Visual repayment progress
- **Dates**: Start date, due date, next payment
- **Contact Info**: Party's phone/email
- **Purpose**: Reason for loan

### Loan Statuses

- **Active**: Loan is ongoing with outstanding balance
- **Completed**: Fully paid off
- **Defaulted**: Payment obligations not met
- **Cancelled**: Loan was cancelled

### Editing a Loan

1. Click the **three-dot menu** on any loan card
2. Select **"Edit"**
3. Modify loan details
4. Save changes

### Deleting a Loan

1. Click the **three-dot menu** on any loan card
2. Select **"Delete"**
3. **Confirm deletion** (⚠️ This also deletes all payment records)

---

## Processing Payments

### Making a Payment (Loans Taken)

When you need to pay back money you borrowed:

1. **Open Payment Dialog**
   - Click loan card's **"Make Payment"** button, or
   - Click three-dot menu → **"Make Payment"**

2. **Review Loan Summary**
   - Outstanding balance
   - Total loan amount
   - Interest rate (if applicable)

3. **Enter Payment Amount**
   - Can be any amount up to outstanding balance
   - System shows maximum allowed

4. **Select Payment Source** (Optional)
   - Choose a bank account to deduct from
   - Or select "None (Cash/Other)"

5. **Payment Details**
   - **Method**: Bank transfer, Cash, Check, Online transfer, Mobile payment, Other
   - **Date**: When payment was made
   - **Late Fee** (Optional): Any penalty charges
   - **Receipt Number** (Optional): For record-keeping
   - **Notes** (Optional): Payment details

6. **Click "Make Payment"**

**What Happens Automatically:**
- ✅ Payment amount is split into principal and interest
- ✅ Loan's outstanding balance is reduced
- ✅ Bank account balance is deducted (if selected)
- ✅ Payment record is created with all details
- ✅ Progress bar updates
- ✅ Status changes to "Completed" if fully paid

### Receiving a Payment (Loans Given)

When someone pays back money you lent:

1. **Open Payment Dialog**
   - Click loan card's **"Receive Payment"** button, or
   - Click three-dot menu → **"Receive Payment"**

2. **Review Loan Summary**
   - Outstanding balance they owe
   - Total loan amount
   - Interest rate (if applicable)

3. **Enter Payment Amount**
   - Amount they're paying
   - Up to outstanding balance

4. **Select Deposit Account** (Optional)
   - Choose bank account to deposit into
   - Or select "None (Cash/Other)"

5. **Payment Details** (same as above)

6. **Click "Receive Payment"**

**What Happens Automatically:**
- ✅ Payment splits into principal and interest
- ✅ Outstanding balance reduces
- ✅ Bank account balance increases (if selected)
- ✅ Payment record created
- ✅ Progress updates
- ✅ Status changes to "Completed" if fully paid

---

## Interest Calculations

### Simple Interest

Formula: **Total = Principal × (1 + Rate × Time)**

**Example:**
- Principal: $10,000
- Rate: 5% per year
- Time: 2 years
- **Interest = $10,000 × 0.05 × 2 = $1,000**
- **Total = $11,000**

### Compound Interest

Formula: **Total = Principal × (1 + Rate)^Time**

**Example:**
- Principal: $10,000
- Rate: 5% per year
- Time: 2 years
- **Total = $10,000 × (1.05)^2 = $11,025**
- **Interest = $1,025**

### How Payments Are Split

Each payment is automatically divided:

1. **Interest Portion**: Calculated first
2. **Principal Portion**: Remainder goes to principal
3. **Outstanding Balance**: Reduced by principal portion

**Example Payment:**
- Outstanding: $11,000 (with $1,000 interest accrued)
- Payment: $500
- Interest portion: Calculated based on current balance
- Principal portion: $500 - interest
- New outstanding: Updated automatically

---

## Payment History

### Viewing Payment Records

Navigate to the **"Payment History"** tab to see:

- **Party Name**: Who paid or received payment
- **Payment Date**: When payment occurred
- **Type Badge**: "Received" (green) or "Paid" (red)
- **Amount**: Total payment with +/- indicator
- **Principal & Interest Breakdown**: Detailed split
- **Receipt Number**: If provided
- **Notes**: Payment details
- **Outstanding After**: Remaining balance after payment

### Payment Information

Each payment record shows:
- Color-coded icons (green for received, red for paid)
- Principal amount applied
- Interest amount charged
- Late fees (if any)
- Payment method used
- Notes and receipt numbers
- Running balance after payment

---

## Tips & Best Practices

### For Loans Given (Lending)

✅ **DO:**
- Record loans immediately
- Set realistic due dates
- Document purpose and collateral
- Track all payments promptly
- Set payment reminders
- Keep receipt numbers
- Review overdue loans regularly

❌ **DON'T:**
- Lend without documentation
- Skip payment records
- Forget to set due dates
- Mix personal and business loans

### For Loans Taken (Borrowing)

✅ **DO:**
- Make payments on time
- Link to bank accounts for tracking
- Keep payment receipts
- Communicate if issues arise
- Pay early when possible
- Track total interest paid

❌ **DON'T:**
- Miss payment dates
- Forget about late fees
- Lose payment documentation
- Ignore payment schedules

### General Best Practices

1. **Set Up Bank Account Links**
   - Automatic balance updates
   - Better financial tracking
   - Accurate records

2. **Use Interest Calculations**
   - Fair compensation for lenders
   - Realistic repayment plans
   - Professional documentation

3. **Regular Reviews**
   - Check overdue loans weekly
   - Review net position monthly
   - Archive completed loans

4. **Document Everything**
   - Add notes to payments
   - Keep receipt numbers
   - Record purpose and collateral
   - Save contact information

5. **Monitor Statistics**
   - Watch your net position
   - Track monthly payments
   - Identify high-risk loans
   - Plan for upcoming payments

---

## Frequently Asked Questions

### Q: Can I edit a loan after creating it?
**A:** Yes, click the three-dot menu → Edit to modify loan details.

### Q: What happens when a loan is fully paid?
**A:** Status automatically changes to "Completed" and moves to the Completed tab.

### Q: Can I delete a payment by mistake?
**A:** Yes, but it won't restore the loan balance. Be careful when deleting payments.

### Q: How is interest calculated on partial payments?
**A:** Interest is calculated first, then the remainder reduces principal. The system handles this automatically.

### Q: Can I have multiple loans with the same person?
**A:** Yes, each loan is tracked separately with its own payment history.

### Q: What if someone doesn't pay on time?
**A:** Update the loan status to "Defaulted" and add late fees when receiving payments.

### Q: Can I export loan data?
**A:** Payment history can be viewed in the Payment History tab. Export features may be added in future updates.

### Q: How do I track cash payments?
**A:** Select "None (Cash/Other)" when choosing the bank account, and add notes for documentation.

---

## Summary

The Loans module provides a complete system for managing lending and borrowing:

- ✅ Track loans given and taken separately
- ✅ Automatic interest calculations (simple or compound)
- ✅ Payment processing with principal/interest split
- ✅ Bank account integration
- ✅ Progress tracking and statistics
- ✅ Overdue loan monitoring
- ✅ Complete payment history
- ✅ Professional documentation

For technical details, see the [Technical Documentation](./LOANS_TECHNICAL.md).

---

**Need Help?** If you encounter any issues or have questions, please check the technical documentation or contact support.
