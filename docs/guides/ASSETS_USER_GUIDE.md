# Asset Management - User Guide

## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
- [Asset Types](#asset-types)
- [Adding Assets](#adding-assets)
- [Managing Assets](#managing-assets)
- [Depreciation Tracking](#depreciation-tracking)
- [Insurance & Warranty Management](#insurance--warranty-management)
- [Best Practices](#best-practices)

---

## Overview

The Asset Management module helps you track, monitor, and manage physical assets including property, vehicles, electronics, jewelry, and more. Monitor depreciation, insurance coverage, warranties, and asset value over time.

### Key Features
- ✅ Track 8+ asset types
- ✅ Depreciation tracking with multiple methods
- ✅ Insurance coverage monitoring
- ✅ Warranty tracking with expiration alerts
- ✅ Asset-specific fields (VIN, serial numbers, addresses)
- ✅ Document storage (receipts, certificates)
- ✅ Purchase and current value tracking
- ✅ "Needs Attention" alerts for expired coverage

---

## Getting Started

### Accessing the Assets Page

1. **From the Sidebar**: Click **"Assets"** (💼 Briefcase icon)
2. **Direct URL**: Navigate to `/assets`

### First Time Setup

When you first access the page, you'll see:
- An empty state with a call-to-action button
- A prompt to add your first asset
- Click **"Add Asset"** to get started

---

## Asset Types

The system supports 8 asset types with specialized tracking:

| Type | Description | Special Fields | Examples |
|------|-------------|----------------|----------|
| **Property** | Real estate holdings | Address, Size (sq ft), Year Built | House, Apartment, Land |
| **Vehicle** | Cars, bikes, boats | Make, Model, Year, VIN, Mileage, License | Tesla Model 3, Honda Civic |
| **Jewelry** | Precious items | Certification, Appraisal Value | Wedding Ring, Necklace |
| **Electronics** | Tech devices | Serial Number, Warranty | Laptop, TV, Smartphone |
| **Furniture** | Home furnishings | Condition | Sofa, Dining Table |
| **Collectibles** | Valuable collections | Authentication | Art, Coins, Stamps |
| **Equipment** | Tools & machinery | Model, Capacity | Power Tools, Gym Equipment |
| **Other** | Miscellaneous assets | None | Antiques, Musical Instruments |

---

## Adding Assets

### Step-by-Step Process

1. **Click "Add Asset"** button (top-right or center of empty state)

2. **Fill in Basic Information** (Required):
   - **Asset Type**: Select from dropdown
   - **Name**: Descriptive name (e.g., "MacBook Pro 2024")
   - **Purchase Price**: Original cost
   - **Current Value**: Estimated current worth
   - **Purchase Date**: Date acquired

3. **Add Type-Specific Details** (Conditional):

   **For Property**:
   - Address (full street address)
   - Size (square footage)
   - Year Built

   **For Vehicle**:
   - Make (e.g., "Tesla")
   - Model (e.g., "Model 3")
   - Year (e.g., "2024")
   - VIN (Vehicle Identification Number)
   - Mileage (current odometer reading)
   - License Plate

   **For Electronics/Equipment**:
   - Serial Number
   - Model Number

4. **Depreciation Settings** (Optional):
   - **Method**: Straight-line or Declining balance
   - **Rate**: Annual depreciation % (e.g., 10%)
   - **Useful Life**: Expected lifespan in years

5. **Insurance Details** (Optional but Recommended):
   - ☑️ **Has Insurance**: Check if insured
   - **Provider**: Insurance company name
   - **Policy Number**: Reference number
   - **Coverage Amount**: Insured value
   - **Premium**: Annual/monthly cost
   - **Start Date**: When coverage began
   - **End Date**: When coverage expires

6. **Warranty Information** (Optional):
   - **Warranty Expiry**: End date of warranty
   - Useful for electronics and appliances

7. **Additional Details** (Optional):
   - **Description**: Detailed notes
   - **Location**: Where asset is kept
   - **Condition**: Current state (Excellent, Good, Fair, Poor)
   - **Documents**: File attachments (receipts, certificates)

8. **Click "Add Asset"** to save

### Example: Adding a Vehicle

```
Asset Type: Vehicle
Name: Tesla Model 3 Long Range
Purchase Price: $45,000
Current Value: $38,000
Purchase Date: 2023-03-15

Vehicle Details:
- Make: Tesla
- Model: Model 3 Long Range
- Year: 2023
- VIN: 5YJ3E1EA1KF123456
- Mileage: 15,000 miles
- License Plate: ABC-1234

Depreciation:
- Method: Declining Balance
- Rate: 15%
- Useful Life: 10 years

Insurance:
✓ Has Insurance
- Provider: State Farm
- Policy Number: SF-987654321
- Coverage Amount: $40,000
- Premium: $1,200/year
- Coverage: 2023-03-20 to 2024-03-20

Warranty:
- Warranty Expiry: 2027-03-15 (4 years)

Calculated Depreciation: $7,000 (15.56%)
```

---

## Managing Assets

### Viewing Asset Details

Each asset card displays:
- **Name** with asset type badge
- **Current Value** (large, prominent)
- **Purchase Price** (for comparison)
- **Depreciation Amount** (Purchase - Current)
- **Depreciation %** (color-coded: 🔴 if > 20%)
- **Insurance Status**:
  - 🟢 "Insured" badge if active
  - 🔴 "Expired" badge if coverage lapsed
  - 🟡 "Expiring Soon" if within 30 days
- **Warranty Status**:
  - 🟢 "Under Warranty" if active
  - 🔴 "Expired" if past date
  - 🟡 "Expiring Soon" if within 30 days
- **Type-Specific Info**:
  - Property: Address, Size
  - Vehicle: Make/Model/Year, Mileage, License
  - Electronics: Serial Number

### Available Actions

Click the **⋮ (three dots)** menu on any asset card:

#### 1. **Edit Asset**
- Update current value (manual revaluation)
- Update insurance details
- Update mileage (for vehicles)
- Update condition
- Modify any other fields

#### 2. **Update Insurance**
- Renew expired coverage
- Change provider
- Update policy details
- Extend coverage dates

#### 3. **Sell Asset**
- Record sale date and price
- Calculate final gain/loss
- Mark as sold
- Preserve historical record

#### 4. **Delete Asset**
- Permanently remove asset
- Shows confirmation dialog
- Cannot be undone
- Use "Sell" for proper record-keeping

---

## Depreciation Tracking

### Understanding Depreciation

**Depreciation** = Loss of value over time due to:
- Wear and tear
- Obsolescence
- Market conditions
- Age

### Depreciation Methods

#### 1. **Straight-Line Depreciation**
- **Formula**: Annual Depreciation = Purchase Price / Useful Life
- **Behavior**: Equal amount each year
- **Best For**: Assets with consistent value loss (furniture, equipment)
- **Example**: $10,000 asset over 10 years = $1,000/year

#### 2. **Declining Balance Depreciation**
- **Formula**: Annual Depreciation = Current Value × Depreciation Rate
- **Behavior**: Higher depreciation early, lower later
- **Best For**: Vehicles, electronics (rapid initial value loss)
- **Example**: $10,000 asset at 20% rate
  - Year 1: $2,000 (20% of $10,000)
  - Year 2: $1,600 (20% of $8,000)
  - Year 3: $1,280 (20% of $6,400)

### Using the Depreciation Calculator

Available on **Analytics Page** (`/analytics`):

1. **Enter Values**:
   - Purchase Price (e.g., $10,000)
   - Current Age (e.g., 2 years)
   - Useful Life (e.g., 10 years)
   - Method (Straight-Line or Declining Balance)

2. **View Results**:
   - **Current Value**: Calculated worth today
   - **Total Depreciation**: Amount lost so far
   - **Annual Depreciation**: Average per year
   - **Remaining Life**: Years of usefulness left

3. **Review Timeline**:
   - Year-by-year breakdown
   - Depreciation amount per year
   - Value at each year
   - Visual progress bars

4. **Application**:
   - Use calculated values to update asset current values
   - Plan for replacements
   - Understand asset lifecycle
   - Tax planning (for business assets)

---

## Insurance & Warranty Management

### Insurance Coverage

**Why Track Insurance?**
- Protect high-value assets
- Ensure continuous coverage
- Avoid lapses and penalties
- Budget for premiums
- Track coverage amounts

**Coverage Status Indicators**:
- 🟢 **Active**: Coverage valid, no action needed
- 🟡 **Expiring Soon**: Within 30 days, renew now
- 🔴 **Expired**: Coverage lapsed, needs immediate attention

### Warranty Tracking

**Why Track Warranties?**
- Free repairs during warranty period
- Avoid unnecessary repair costs
- Plan for post-warranty maintenance
- Extended warranty decisions

**Warranty Status Indicators**:
- 🟢 **Active**: Under warranty protection
- 🟡 **Expiring Soon**: Within 30 days, decide on extension
- 🔴 **Expired**: Out of warranty, budget for repairs

### "Needs Attention" Alerts

The Assets page highlights items requiring action:

**Alert Types**:
1. **Expired Insurance** (High Priority)
   - Red border on card
   - "Expired" badge
   - Displayed in "Needs Attention" section
   - Action: Renew immediately

2. **Expiring Insurance** (Medium Priority)
   - Yellow warning
   - "Expiring Soon" badge
   - Action: Schedule renewal

3. **Expired Warranty** (Low Priority)
   - Information badge
   - Action: Consider extended warranty

4. **Expiring Warranty** (Low Priority)
   - Information badge
   - Action: Decide on extension before expiry

**Taking Action**:
1. Review "Needs Attention" section (top of page)
2. Click asset card to see details
3. Click ⋮ → "Update Insurance" or "Edit Asset"
4. Renew coverage or extend warranty
5. Save changes
6. Alert disappears from list

---

## Asset Monitoring

### Summary Cards

Four key metrics at the top:

1. **Total Assets**
   - Count of all active assets
   - Quick inventory check

2. **Current Value**
   - Sum of all asset values
   - Total asset worth

3. **Total Depreciation**
   - Sum of value lost
   - (Purchase Prices - Current Values)

4. **Insured Assets**
   - Count of assets with active insurance
   - Coverage tracking

### Asset Breakdown by Type

Visual breakdown showing:
- **Type Distribution**: Percentage by type
- **Progress Bars**: Visual representation
- **Current Values**: For each type
- **Count**: Number per type

### Most Valuable Assets

Lists **highest-value assets**:
- Sorted by current value (descending)
- Shows current and purchase prices
- Helps prioritize insurance
- Focus on high-value item maintenance

---

## Best Practices

### 1. Regular Valuations
- **Real Estate**: Annual professional appraisal
- **Vehicles**: Check KBB/Edmunds quarterly
- **Electronics**: Monitor market prices
- **Jewelry**: Appraise every 2-3 years
- Update current values in system

### 2. Insurance Management
- Review coverage annually
- Set calendar reminders 60 days before expiry
- Compare quotes from multiple providers
- Increase coverage for appreciated assets
- Bundle policies for discounts

### 3. Documentation
- Scan and upload receipts
- Store warranty certificates
- Keep insurance policies accessible
- Photograph valuable items
- Document serial numbers

### 4. Depreciation Tracking
- Use appropriate method per asset type
- Update values annually (minimum)
- Consider market conditions
- Plan for replacement costs
- Tax deductions for business assets

### 5. Warranty Maximization
- Register products immediately
- Keep warranty cards/emails
- Set expiry reminders
- Review extended warranty value
- Document warranty claims

### 6. Asset Maintenance
- Regular servicing extends life
- Document maintenance in notes
- Track repair costs
- Note condition changes
- Preserve value through upkeep

### 7. Security & Safety
- Store high-value items securely
- Update security systems
- Review insurance if security improves
- Document security measures
- Lower premiums possible

### 8. Disposal Planning
- Use "Sell" feature, not delete
- Document sale prices
- Calculate gain/loss for taxes
- Preserve historical records
- Learn from depreciation patterns

---

## Common Workflows

### Adding a Home (Property)
```
1. Click "Add Asset"
2. Type: Property
3. Name: "123 Main St - Primary Residence"
4. Purchase Price: $450,000
5. Current Value: $520,000 (appreciated!)
6. Purchase Date: 2020-06-01
7. Address: 123 Main Street, City, State 12345
8. Size: 2,400 sq ft
9. Year Built: 2015
10. Insurance: Homeowners policy details
11. Save asset
```

### Tracking a Vehicle Fleet
```
1. Add each vehicle separately
2. Include VIN and license for each
3. Set up 15-20% declining depreciation
4. Track mileage in notes or custom field
5. Monitor insurance expiry dates
6. Schedule value updates quarterly
7. Use "Most Valuable" to prioritize maintenance
```

### Managing Electronics
```
1. Add with serial numbers
2. Enter warranty expiry dates
3. Set declining depreciation (20-30%)
4. Upload receipts as documents
5. Check warranty status monthly
6. Plan replacements when warranty expires
7. Update values based on market prices
```

### Insurance Renewal Process
```
1. Check "Needs Attention" 60 days ahead
2. Get quotes from 3+ providers
3. Compare coverage and premiums
4. Choose best option
5. Click ⋮ → Update Insurance
6. Enter new policy details
7. Extend coverage dates
8. Save changes
9. Alert clears
```

---

## Tips & Tricks

### Accurate Valuations
- **Property**: Zillow, Redfin, recent comps
- **Vehicles**: KBB, Edmunds, dealer quotes
- **Electronics**: eBay sold listings, Amazon
- **Jewelry**: Professional appraisals
- **Collectibles**: Auction house estimates

### Depreciation Rates by Type
- **Vehicles**: 15-25% per year
- **Electronics**: 20-30% per year
- **Furniture**: 5-10% per year
- **Equipment**: 10-20% per year
- **Property**: Often appreciates (negative depreciation)

### Insurance Optimization
- Increase deductibles to lower premiums
- Bundle auto + home for 15-25% discount
- Install security systems for discounts
- Good credit improves rates
- Review annually, switch if better deal

### Document Organization
- Create digital folder per asset
- Scan receipts immediately
- Store in cloud (Dropbox, Google Drive)
- Link/reference in asset notes
- Backup documents regularly

---

## Troubleshooting

### Issue: Asset Value Not Depreciating
- **Check**: Depreciation method and rate set?
- **Check**: Using correct method for asset type?
- **Solution**: Edit asset, set depreciation parameters
- **Note**: Property may appreciate instead

### Issue: Insurance Alerts Not Showing
- **Check**: Insurance end date entered?
- **Check**: Date is future, not past?
- **Solution**: Edit asset, verify insurance section
- **Note**: Alerts show 30 days before expiry

### Issue: Can't Track Mileage for Vehicle
- **Current**: No dedicated mileage tracking field
- **Workaround**: Add to notes or description
- **Update**: Record current mileage when editing
- **Future**: Dedicated mileage field planned

### Issue: Wrong Depreciation Calculation
- **Check**: Purchase price correct?
- **Check**: Depreciation rate reasonable?
- **Check**: Useful life matches asset type?
- **Solution**: Use depreciation calculator to verify
- **Adjust**: Change method or rate as needed

---

## Next Steps

- 📊 **Visit Analytics Page**: Use depreciation calculator
- 💰 **Add Investments**: Track financial assets
- 🔔 **Enable Notifications**: Get expiry alerts
- 📈 **Net Worth**: See combined portfolio value

---

## Quick Reference

### Recommended Depreciation Rates

| Asset Type | Method | Rate | Useful Life |
|------------|--------|------|-------------|
| Vehicle | Declining | 15-20% | 10 years |
| Electronics | Declining | 25-30% | 3-5 years |
| Furniture | Straight-Line | - | 10-15 years |
| Appliances | Straight-Line | - | 10 years |
| Property | N/A | Often appreciates | N/A |
| Jewelry | N/A | Holds value | N/A |

### Insurance Coverage Guidelines

| Asset Type | Recommended Coverage |
|------------|---------------------|
| Home | Replacement cost + liability |
| Vehicle | Full coverage if < 10 years old |
| Jewelry | Separate rider if > $5,000 |
| Electronics | Homeowner's may cover, check limits |
| Collectibles | Special collectibles insurance |

---

**Last Updated**: October 31, 2025  
**Version**: 1.0.0  
**Module**: Phase 6 - Investments & Assets
