# Enhanced Notifications - AI-Powered Spending Detection

## 🎯 Overview

**Status**: AI Service Complete ✅  
**Date**: November 1, 2025  
**Feature**: Enhanced Notifications (Phase 2 - Medium Priority)

---

## ✅ What Was Created

### AI-Powered Spending Analysis Service
**File**: `/src/lib/services/ai-spending-analysis.service.ts` (495 lines)

A comprehensive machine learning and statistical analysis service that provides:

#### 🤖 Core AI Features:

**1. Anomaly Detection**
- Statistical Z-score analysis for unusual transactions
- Multi-dimensional anomaly detection (amount, frequency, category, timing)
- Configurable sensitivity levels (low/medium/high)
- Confidence scoring for each anomaly
- Severity classification (low/medium/high/critical)

**2. Spending Pattern Learning**
- Historical pattern calculation per category
- Average amounts and standard deviations
- Frequency analysis
- Typical transaction days and times
- Behavioral profiling

**3. Budget Prediction**
- Linear regression for spending projection
- Probability calculation using sigmoid function
- Daily spending limit recommendations
- Risk severity assessment
- Proactive budget alerts

**4. Intelligent Insights**
- Budget risk alerts with actionable recommendations
- Spending trend change detection
- New category identification
- Transaction frequency analysis
- Confidence-based prioritization

**5. Low Balance Warnings**
- Predictive balance depletion calculation
- Days-until-zero estimation
- Severity-based alerts
- Spending pattern-based predictions

---

## 🧠 AI Algorithms Used

### 1. Z-Score Anomaly Detection
```typescript
Z-Score = (Amount - Average) / Standard Deviation

If |Z-Score| > threshold:
  - > 4.0: Critical anomaly
  - > 3.0: High anomaly
  - > 2.5: Medium anomaly
  - > 2.0: Low anomaly

Anomaly Score = min(100, |Z-Score| × 33.33)
Confidence = min(0.95, |Z-Score| / 5)
```

### 2. Budget Prediction (Linear Regression)
```typescript
Daily Rate = Current Spending / Days Passed
Projected Spending = Daily Rate × Total Days in Month

Excess Ratio = (Projected - Budget) / Budget
Probability = 1 / (1 + e^(-5 × Excess Ratio))  // Sigmoid

Severity:
  - Current > Budget: Critical
  - Probability > 0.8: Danger
  - Probability > 0.5: Warning
  - Otherwise: Safe
```

### 3. Pattern Recognition
```typescript
For each category:
  - Calculate μ (mean) and σ (std deviation)
  - Identify typical days (above average frequency)
  - Identify typical hours (above average frequency)
  - Track min/max amounts
  - Build behavioral profile

New transaction:
  - Compare to historical pattern
  - Flag if outside normal parameters
  - Generate context-aware recommendations
```

### 4. Confidence Scoring
```typescript
Confidence = (Data Confidence × 0.3) + 
             (Anomaly Confidence × 0.5) + 
             (Consistency Score × 0.2)

Where:
  - Data Confidence = min(1, historical_points / 100)
  - Anomaly Confidence = min(1, |z_score| / 5)
  - Consistency Score = pattern consistency metric
```

---

## 📊 Service API

### AISpendingAnalysisService Methods

```typescript
// 1. Detect Anomalies
detectAnomalies(
  recentTransactions: Transaction[],
  historicalTransactions: Transaction[],
  sensitivity?: 'low' | 'medium' | 'high'
): SpendingAnomaly[]

// Returns array of detected anomalies with:
// - Anomaly score (0-100)
// - Type (amount/frequency/category/timing)
// - Confidence level (0-1)
// - Severity (low/medium/high/critical)
// - Actionable recommendations

// 2. Calculate Patterns
calculateSpendingPatterns(
  transactions: Transaction[]
): Map<string, SpendingPattern>

// Returns spending patterns per category:
// - Average amount & standard deviation
// - Min/max amounts
// - Transaction frequency
// - Typical days and times

// 3. Predict Budget Status
predictBudgetStatus(
  currentMonthTransactions: Transaction[],
  budgets: Budget[]
): BudgetPrediction[]

// Returns predictions with:
// - Current vs projected spending
// - Probability of exceeding budget
// - Recommended daily limits
// - Alert severity

// 4. Generate Insights
generateInsights(
  currentTransactions: Transaction[],
  previousTransactions: Transaction[],
  budgetPredictions: BudgetPrediction[]
): SpendingInsight[]

// Returns actionable insights:
// - Budget risks
// - Trend changes
// - New categories
// - Frequency anomalies

// 5. Detect Low Balance
detectLowBalanceWarnings(
  balance: number,
  averageMonthlyExpenses: number,
  thresholdDays?: number
): LowBalanceWarning | null

// Returns warning if balance critical:
// - Days until zero
// - Severity level
// - Contextual message
```

---

## 🎯 Detection Types

### Anomaly Types

**1. Amount Anomalies**
- Transactions significantly higher/lower than historical average
- Z-score based detection
- Category-specific thresholds
- Example: $500 on groceries when average is $150

**2. Frequency Anomalies**
- Unusual number of transactions in a period
- Comparison to historical patterns
- Example: 20 transactions this week vs. average of 5

**3. Category Anomalies**
- Spending in new categories
- Unexpected category usage
- Example: First time spending in "Gambling"

**4. Timing Anomalies**
- Transactions on unusual days/times
- Pattern deviation detection
- Example: Restaurant spending at 3 AM (unusual)

### Severity Levels

```typescript
Critical (Score 90-100):
- Amount > 4σ from mean
- Budget exceeded by 50%+
- Balance < 2 days of expenses

High (Score 70-89):
- Amount > 3σ from mean
- Budget 80-100% utilized
- Balance < 5 days of expenses

Medium (Score 50-69):
- Amount > 2.5σ from mean
- Budget 60-80% utilized
- Balance < 7 days of expenses

Low (Score 0-49):
- Amount > 2σ from mean
- Budget 50-60% utilized
- Minor deviations
```

---

## 💡 Usage Examples

### Example 1: Detect Unusual Spending
```typescript
import { AISpendingAnalysisService } from '@/lib/services/ai-spending-analysis.service';

// Get recent transactions (last 7 days)
const recentTxns = transactions.filter(t => isRecent(t.date, 7));

// Get historical data (last 6 months)
const historicalTxns = transactions.filter(t => isHistorical(t.date, 180));

// Detect anomalies
const anomalies = AISpendingAnalysisService.detectAnomalies(
  recentTxns,
  historicalTxns,
  'medium' // sensitivity
);

// Show top 5 most unusual transactions
const topAnomalies = anomalies.slice(0, 5);
topAnomalies.forEach(anomaly => {
  if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
    // Create notification
    createNotification({
      type: 'unusual_spending_detected',
      title: `Unusual ${anomaly.transaction.category?.name} Spending`,
      message: anomaly.reason,
      priority: 'high',
      metadata: { anomaly }
    });
  }
});
```

### Example 2: Predict Budget Overruns
```typescript
// Get current month transactions
const currentMonth = getCurrentMonthTransactions();

// Get active budgets
const budgets = await getBudgets();

// Predict budget status
const predictions = AISpendingAnalysisService.predictBudgetStatus(
  currentMonth,
  budgets
);

// Alert for at-risk budgets
predictions
  .filter(p => p.alert && p.severity !== 'safe')
  .forEach(pred => {
    createNotification({
      type: 'budget_alert',
      title: `${pred.category} Budget at ${(pred.probability * 100).toFixed(0)}% Risk`,
      message: `You're projected to spend $${pred.projectedSpending.toFixed(0)}, exceeding your $${pred.budgetLimit} budget. Limit daily spending to $${pred.recommendedDailyLimit.toFixed(2)}.`,
      priority: pred.severity === 'critical' ? 'urgent' : 'high',
      metadata: { prediction: pred }
    });
  });
```

### Example 3: Generate Insights
```typescript
// Get transaction data
const currentTxns = getCurrentMonthTransactions();
const previousTxns = getPreviousMonthTransactions();

// Get budget predictions
const predictions = AISpendingAnalysisService.predictBudgetStatus(
  currentTxns,
  budgets
);

// Generate insights
const insights = AISpendingAnalysisService.generateInsights(
  currentTxns,
  previousTxns,
  predictions
);

// Show actionable insights
insights
  .filter(i => i.actionable && i.confidence > 0.7)
  .forEach(insight => {
    createNotification({
      type: 'spending_insight',
      title: insight.title,
      message: `${insight.description} ${insight.recommendation || ''}`,
      priority: insight.impact === 'negative' ? 'high' : 'normal',
      metadata: { insight }
    });
  });
```

### Example 4: Low Balance Warning
```typescript
// Get current balance
const balance = bankAccount.balance;

// Calculate average monthly expenses
const avgExpenses = calculateAverageMonthlyExpenses(transactions);

// Check for low balance
const warning = AISpendingAnalysisService.detectLowBalanceWarnings(
  balance,
  avgExpenses,
  7 // alert if < 7 days left
);

if (warning) {
  createNotification({
    type: 'low_balance_warning',
    title: `Low Balance Alert`,
    message: warning.message,
    priority: warning.severity === 'high' ? 'urgent' : 'high',
    metadata: { warning }
  });
}
```

---

## 🔄 Integration with Existing System

### Notification Types to Add

```typescript
// In notification types enum
export type NotificationType =
  | 'unusual_spending_detected'  // NEW
  | 'budget_alert'
  | 'budget_warning'
  | 'budget_exceeded'
  | 'spending_insight'           // NEW
  | 'low_balance_warning'
  | 'goal_milestone'
  | 'bill_reminder_3_days'
  | 'bill_reminder_1_day'
  | 'bill_reminder_today'
  | 'credit_card_payment_due'
  | 'loan_emi_reminder'
  | 'subscription_renewal';
```

### Scheduled Analysis Jobs

```typescript
// Run daily at midnight
scheduledJobs.add({
  name: 'daily-spending-analysis',
  schedule: '0 0 * * *', // Cron: daily at midnight
  handler: async () => {
    // Get transactions
    const recent = await getRecentTransactions(7);
    const historical = await getHistoricalTransactions(180);
    
    // Detect anomalies
    const anomalies = AISpendingAnalysisService.detectAnomalies(
      recent,
      historical,
      'medium'
    );
    
    // Create notifications for significant anomalies
    for (const anomaly of anomalies) {
      if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
        await createNotification({
          type: 'unusual_spending_detected',
          title: `Unusual ${anomaly.transaction.category?.name} Spending Detected`,
          message: anomaly.reason,
          priority: anomaly.severity === 'critical' ? 'urgent' : 'high',
          metadata: { anomaly }
        });
      }
    }
  }
});

// Run weekly for insights
scheduledJobs.add({
  name: 'weekly-spending-insights',
  schedule: '0 9 * * 1', // Cron: Mondays at 9 AM
  handler: async () => {
    const currentWeek = await getCurrentWeekTransactions();
    const previousWeek = await getPreviousWeekTransactions();
    const predictions = AISpendingAnalysisService.predictBudgetStatus(
      await getCurrentMonthTransactions(),
      await getBudgets()
    );
    
    const insights = AISpendingAnalysisService.generateInsights(
      currentWeek,
      previousWeek,
      predictions
    );
    
    // Send weekly summary
    await createNotification({
      type: 'spending_insight',
      title: 'Weekly Spending Insights',
      message: `We've analyzed your spending and found ${insights.length} insights for you.`,
      priority: 'normal',
      metadata: { insights }
    });
  }
});
```

---

## 📈 Performance Characteristics

### Computational Complexity

- `detectAnomalies()`: O(n × m) where n = recent txns, m = categories
- `calculateSpendingPatterns()`: O(n) where n = historical txns
- `predictBudgetStatus()`: O(b) where b = budgets
- `generateInsights()`: O(n + m) where n = current, m = previous txns

### Recommended Usage

- **Real-time**: Low balance warnings, critical anomalies
- **Near real-time** (1-5 min): Budget predictions after new transaction
- **Scheduled** (daily): Full anomaly detection scan
- **Scheduled** (weekly): Insight generation and trend analysis

### Optimization Tips

1. **Cache patterns**: Store calculated patterns for 24 hours
2. **Incremental updates**: Update patterns on new transactions
3. **Batch processing**: Analyze multiple transactions together
4. **Lazy loading**: Load historical data only when needed
5. **Memoization**: Cache expensive calculations

---

## 🎨 UI Integration

### Dashboard Widget
```tsx
<AIInsightsWidget>
  {insights.map(insight => (
    <InsightCard
      key={insight.type}
      title={insight.title}
      description={insight.description}
      impact={insight.impact}
      confidence={insight.confidence}
      recommendation={insight.recommendation}
    />
  ))}
</AIInsightsWidget>
```

### Anomaly Alerts
```tsx
<AnomalyAlert
  anomaly={anomaly}
  onDismiss={() => markAsReviewed(anomaly)}
  onViewTransaction={() => navigate(`/transactions/${anomaly.transaction.id}`)}
/>
```

### Budget Risk Indicator
```tsx
<BudgetRiskCard
  prediction={prediction}
  severity={prediction.severity}
  recommended DailyLimit={prediction.recommendedDailyLimit}
/>
```

---

## 🧪 Testing Recommendations

### Unit Tests
```typescript
describe('AISpendingAnalysisService', () => {
  describe('detectAnomalies', () => {
    it('should detect amount anomalies', () => {
      // Test Z-score calculation
    });
    
    it('should detect timing anomalies', () => {
      // Test day/hour pattern matching
    });
    
    it('should handle sensitivity levels', () => {
      // Test low/medium/high thresholds
    });
  });
  
  describe('predictBudgetStatus', () => {
    it('should project spending accurately', () => {
      // Test linear regression
    });
    
    it('should calculate probability correctly', () => {
      // Test sigmoid function
    });
  });
});
```

---

## 📚 Future Enhancements

### Potential Additions:
1. **Deep Learning Models** - LSTM for sequence prediction
2. **Collaborative Filtering** - Compare to similar users
3. **Seasonal Adjustment** - Holiday spending patterns
4. **Multi-variate Analysis** - Correlate multiple factors
5. **Causal Inference** - Identify spending triggers
6. **Real-time Streaming** - Live anomaly detection
7. **Custom Thresholds** - User-defined sensitivity
8. **Explainable AI** - Detailed reasoning for predictions

---

## ✅ Implementation Status

### Completed
- [x] AI Spending Analysis Service (495 lines)
- [x] Anomaly detection algorithms
- [x] Pattern recognition system
- [x] Budget prediction engine
- [x] Insight generation
- [x] Low balance warnings

### Next Steps
1. Integrate with notification system
2. Add scheduled jobs for automated analysis
3. Create UI components for insights display
4. Build notification preferences for AI alerts
5. Add user feedback loop for ML improvement

---

**Version**: 1.0.0  
**Status**: ✅ AI Service Complete  
**AI Algorithms**: Z-Score, Linear Regression, Sigmoid, Pattern Recognition  
**Date**: November 1, 2025
