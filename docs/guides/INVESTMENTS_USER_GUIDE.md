# Investment Portfolio Management - User Guide

## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
- [Investment Types](#investment-types)
- [Adding Investments](#adding-investments)
- [Managing Investments](#managing-investments)
- [Portfolio Analytics](#portfolio-analytics)
- [Best Practices](#best-practices)

---

## Overview

The Investment Portfolio Management module helps you track and analyze your investment portfolio across multiple asset classes. Monitor profits, losses, ROI, dividends, and portfolio diversification in real-time.

### Key Features
- ✅ Track 10+ investment types (stocks, crypto, bonds, mutual funds, etc.)
- ✅ Real-time profit/loss calculations with currency support
- ✅ Dividend tracking and recording
- ✅ Portfolio diversification analysis
- ✅ ROI tracking with annualized returns
- ✅ Top/worst performers identification
- ✅ Multi-currency support (USD, EUR, GBP, INR, JPY, AUD, CAD, CHF)
- ✅ Historical tracking with days held calculation

---

## Getting Started

### Accessing the Investments Page

1. **From the Sidebar**: Click **"Investments"** (💰 Wallet icon)
2. **Direct URL**: Navigate to `/investments`

### First Time Setup

When you first access the page, you'll see:
- An empty state with a call-to-action button
- A prompt to add your first investment
- Click **"Add Investment"** to get started

---

## Investment Types

The system supports 10 investment types:

| Type | Description | Examples |
|------|-------------|----------|
| **Stock** | Individual company shares | AAPL, GOOGL, TSLA |
| **Mutual Fund** | Pooled investment funds | Vanguard Index Fund |
| **Bond** | Fixed-income securities | Treasury Bonds, Corporate Bonds |
| **Cryptocurrency** | Digital currencies | Bitcoin, Ethereum |
| **Fixed Deposit** | Bank term deposits | 1-year FD, 5-year FD |
| **Gold** | Physical or digital gold | Gold coins, Gold ETF |
| **ETF** | Exchange-traded funds | S&P 500 ETF, NASDAQ ETF |
| **REIT** | Real Estate Investment Trusts | Residential REIT, Commercial REIT |
| **Commodities** | Raw materials | Oil, Silver, Agricultural |
| **Other** | Miscellaneous investments | Peer-to-peer lending, Art |

---

## Adding Investments

### Step-by-Step Process

1. **Click "Add Investment"** button (top-right or center of empty state)

2. **Fill in Required Information**:
   - **Investment Type**: Select from dropdown (required)
   - **Name**: Descriptive name (required)
   - **Symbol/Ticker**: Stock symbol (optional, e.g., "AAPL")
   - **Quantity**: Number of units (required, supports 8 decimal places for crypto)
   - **Purchase Price**: Price per unit when purchased (required)
   - **Current Price**: Current market price per unit (required)
   - **Purchase Date**: Date of purchase (required)
   - **Currency**: Select currency (default: USD)
   - **Platform**: Trading platform (optional, e.g., "Robinhood")
   - **Dividend Yield**: Annual dividend yield % (optional)
   - **Notes**: Additional information (optional)

3. **Review Calculations**:
   - Total Invested = Quantity × Purchase Price
   - Current Value = Quantity × Current Price
   - Profit/Loss = Current Value - Total Invested
   - P&L % = (Current Price - Purchase Price) / Purchase Price × 100

4. **Click "Add Investment"** to save

### Example: Adding a Stock Investment

```
Investment Type: Stock
Name: Apple Inc.
Symbol: AAPL
Quantity: 100
Purchase Price: $150.00
Current Price: $175.00
Purchase Date: 2024-01-15
Currency: USD
Platform: Robinhood
Dividend Yield: 0.5%
Notes: Tech sector long-term hold

Calculated:
- Total Invested: $15,000.00
- Current Value: $17,500.00
- Profit/Loss: +$2,500.00 (+16.67%)
```

---

## Managing Investments

### Viewing Investment Details

Each investment card displays:
- **Name & Symbol** (with investment type badge)
- **Current Value** (Quantity × Current Price)
- **Profit/Loss** (in dollar amount and percentage)
  - 🟢 Green for profits
  - 🔴 Red for losses
- **Purchase Price** per unit
- **Current Price** per unit
- **Days Held** since purchase
- **ROI** including dividends
- **Platform** name

### Available Actions

Click the **⋮ (three dots)** menu on any investment card:

#### 1. **Edit Investment**
- Update current price
- Modify quantity (buy more or sell partial)
- Update platform or notes
- Cannot change: Purchase price, purchase date, type

#### 2. **Record Dividend**
- Enter dividend amount received
- Automatically adds to total dividends
- Improves ROI calculation
- Tracks dividend history

#### 3. **Sell Investment**
- Records the sale date
- Marks investment as sold
- Calculates final P&L
- Moves to "Sold Investments" section
- Preserves historical data

#### 4. **Delete Investment**
- Permanently removes the investment
- Shows confirmation dialog
- Cannot be undone
- Use "Sell" instead for historical tracking

### Updating Prices

**Bulk Update** (recommended for multiple investments):
1. Use the price update feature (if available)
2. Enter new current prices for multiple investments
3. Save all changes at once

**Individual Update**:
1. Click Edit on the investment card
2. Update the "Current Price" field
3. Click Save

---

## Portfolio Analytics

### Summary Cards (Top Section)

Four key metrics displayed at the top:

1. **Total Invested**
   - Sum of all purchase amounts
   - Initial capital deployed

2. **Current Value**
   - Sum of all current values
   - Real-time portfolio worth

3. **Total P&L**
   - Current Value - Total Invested
   - Color-coded (green/red)
   - Shows overall performance

4. **Total Dividends**
   - Sum of all dividends received
   - Additional income beyond capital gains

### Investment Breakdown by Type

Visual breakdown showing:
- **Type Distribution**: Percentage of portfolio per type
- **Progress Bars**: Visual representation
- **Invested vs Current Value**: For each type
- **Count**: Number of investments per type

Use this to ensure proper diversification across asset classes.

### Top Performers

Lists your **best-performing investments**:
- Sorted by highest ROI %
- Shows profit amount and percentage
- Helps identify winning strategies
- Consider increasing allocation to strong performers

### Worst Performers

Lists **underperforming investments**:
- Sorted by lowest ROI %
- Shows loss amount and percentage
- Review for potential sell decisions
- Identify areas needing attention

### Portfolio Diversification Chart

Available on the **Analytics Page** (`/analytics`):
- **Pie Chart**: Visual portfolio composition
- **Legend**: Type breakdown with percentages
- **Values**: Dollar amounts per type
- **Count**: Number of investments per type

### ROI Tracker

Available on the **Analytics Page**:
- **Overall ROI**: Portfolio-wide return percentage
- **Total P&L**: Net profit or loss
- **Winners vs Losers**: Count of positive vs negative returns
- **Individual ROI**: Each investment's performance
- **Annualized ROI**: Returns normalized to 1-year basis

---

## Best Practices

### 1. Keep Prices Updated
- Update current prices weekly or daily for active trading
- Use automated price feeds if available
- Accurate prices ensure correct P&L calculations

### 2. Diversify Your Portfolio
- Target: No single type > 30% of portfolio
- Mix high-risk (crypto) with low-risk (bonds)
- Consider different sectors and geographies
- Use the diversification chart to monitor balance

### 3. Track Dividends
- Record all dividend payments immediately
- Improves ROI accuracy
- Helps calculate total return
- Important for income-focused strategies

### 4. Use Symbols/Tickers
- Easier to identify investments
- Consistent naming convention
- Helpful for price updates
- Standard format (e.g., "AAPL", "BTC-USD")

### 5. Add Meaningful Notes
- Investment thesis (why you bought)
- Target sell price
- Stop-loss levels
- Rebalancing reminders
- Tax considerations

### 6. Review Performance Regularly
- Weekly: Check top/worst performers
- Monthly: Review overall ROI and diversification
- Quarterly: Rebalance if needed
- Yearly: Tax-loss harvesting opportunities

### 7. Long-Term Thinking
- Days held is tracked automatically
- Consider tax implications (long-term vs short-term gains)
- Don't panic sell on short-term volatility
- Monitor annualized ROI for true performance

### 8. Document Sell Decisions
- Use "Sell Investment" instead of delete
- Preserves historical performance data
- Helps analyze past decisions
- Important for tax records

---

## Common Workflows

### Adding a Stock Portfolio
```
1. Click "Add Investment"
2. Type: Stock
3. Add all stocks one by one
4. Group by sector in notes
5. Review diversification chart
6. Set up weekly price update routine
```

### Tracking Cryptocurrency
```
1. Type: Cryptocurrency
2. Use precise quantities (8 decimals)
3. Symbol: BTC-USD, ETH-USD, etc.
4. Platform: Coinbase, Binance, etc.
5. Update prices frequently (daily)
6. Monitor high volatility
```

### Recording Dividends
```
1. Receive dividend payment
2. Find investment card
3. Click ⋮ → Record Dividend
4. Enter amount received
5. ROI automatically updates
6. Track quarterly patterns
```

### Selling an Investment
```
1. Decide to exit position
2. Click ⋮ → Sell Investment
3. Confirm sale
4. Investment marked as sold
5. Final P&L calculated
6. Historical data preserved
```

---

## Tips & Tricks

### Currency Conversion
- System supports 8 currencies
- Convert manually before entering
- Keep all related investments in same currency for accuracy
- Note exchange rates in notes field

### Quantity Precision
- Stocks: Usually whole numbers or fractions
- Crypto: Up to 8 decimal places (0.00000001 BTC)
- Mutual Funds: Decimals allowed
- Gold: By weight (grams, ounces)

### Platform Tracking
- Track where investments are held
- Useful for account consolidation
- Fee comparison across platforms
- Withdrawal planning

### Dividend Yield
- Enter annual yield percentage
- Used for income planning
- Compare dividend stocks
- Track yield changes over time

---

## Troubleshooting

### Issue: Incorrect P&L Calculation
- **Check**: Current price is up to date
- **Check**: Quantity is correct (stock splits?)
- **Solution**: Edit investment and update values

### Issue: Can't See Sold Investments
- **Cause**: Sold investments filtered out by default
- **Solution**: Look for "Sold Investments" section (if available)
- **Alternative**: Check investment history

### Issue: Wrong Currency Display
- **Cause**: Investment saved with different currency
- **Solution**: Edit investment, verify currency setting
- **Note**: Cannot auto-convert between currencies

### Issue: Missing Dividends
- **Cause**: Not recorded in system
- **Solution**: Manually record each dividend payment
- **Tip**: Set up quarterly reminders

---

## Next Steps

- 📊 **Visit Analytics Page**: View advanced portfolio analytics
- 💰 **Add Assets**: Track physical assets like property, vehicles
- 📈 **Set Budgets**: Integrate with budgeting module
- 🔔 **Enable Notifications**: Get alerts for portfolio changes

---

## Quick Reference

### Keyboard Shortcuts
(If implemented in future versions)
- `Cmd/Ctrl + N`: Add new investment
- `Cmd/Ctrl + R`: Refresh prices
- `Cmd/Ctrl + F`: Search investments

### Important Calculations
- **Total Invested** = Σ(Quantity × Purchase Price)
- **Current Value** = Σ(Quantity × Current Price)
- **P&L** = Current Value - Total Invested
- **P&L %** = (Current Price - Purchase Price) / Purchase Price × 100
- **ROI** = (Current Value + Dividends - Total Invested) / Total Invested × 100
- **Annualized ROI** = (ROI / Days Held) × 365

---

**Last Updated**: October 31, 2025  
**Version**: 1.0.0  
**Module**: Phase 6 - Investments & Assets
