import { useEffect } from 'react';
import { useBudgetsWithSpending } from '@/lib/hooks/use-budget-queries';
import { toast } from 'sonner';

interface BudgetAlert {
    budgetId: string;
    categoryName: string;
    amount: number;
    spent: number;
    percentage: number;
    status: 'warning' | 'exceeded';
}

/**
 * Hook to monitor budgets and show alerts when thresholds are exceeded
 * Checks on mount and whenever budget data changes
 */
export function useBudgetAlerts() {
    const { data: budgets } = useBudgetsWithSpending();

    useEffect(() => {
        if (!budgets || budgets.length === 0) return;

        const alerts: BudgetAlert[] = [];

        // Check each budget for threshold violations
        budgets.forEach((budget) => {
            if (budget.status === 'exceeded' || budget.status === 'warning') {
                alerts.push({
                    budgetId: budget.id,
                    categoryName: budget.category?.name || 'Unknown',
                    amount: budget.amount,
                    spent: budget.spent,
                    percentage: budget.percentage,
                    status: budget.status,
                });
            }
        });

        // Show alerts (only on initial load or significant changes)
        // We use localStorage to track which alerts have been shown to avoid spam
        const shownAlerts = getShownAlerts();
        const newAlerts = alerts.filter(
            (alert) => !shownAlerts.includes(generateAlertKey(alert))
        );

        if (newAlerts.length > 0) {
            showBudgetAlerts(newAlerts);
            markAlertsAsShown(newAlerts);
        }
    }, [budgets]);

    return {
        budgets,
    };
}

/**
 * Check if there are any budget alerts without showing toasts
 * Useful for dashboard widgets or notification badges
 */
export function useBudgetAlertsCount() {
    const { data: budgets } = useBudgetsWithSpending();

    if (!budgets) return { exceededCount: 0, warningCount: 0, totalCount: 0 };

    const exceededCount = budgets.filter((b) => b.status === 'exceeded').length;
    const warningCount = budgets.filter((b) => b.status === 'warning').length;

    return {
        exceededCount,
        warningCount,
        totalCount: exceededCount + warningCount,
    };
}

/**
 * Get budgets that need attention (warning or exceeded)
 */
export function useBudgetsNeedingAttention() {
    const { data: budgets } = useBudgetsWithSpending();

    if (!budgets) return [];

    return budgets.filter((b) => b.status === 'exceeded' || b.status === 'warning');
}

// ============================================================================
// Helper Functions
// ============================================================================

function showBudgetAlerts(alerts: BudgetAlert[]) {
    // Group by status
    const exceeded = alerts.filter((a) => a.status === 'exceeded');
    const warning = alerts.filter((a) => a.status === 'warning');

    // Show exceeded alerts first (more urgent)
    exceeded.forEach((alert) => {
        const overspent = alert.spent - alert.amount;
        toast.error(`Budget Exceeded: ${alert.categoryName}`, {
            description: `You've exceeded your budget by $${overspent.toLocaleString()}. Current spending: $${alert.spent.toLocaleString()} of $${alert.amount.toLocaleString()}.`,
            duration: 8000,
        });
    });

    // Show warning alerts
    warning.forEach((alert) => {
        const remaining = alert.amount - alert.spent;
        toast.warning(`Budget Alert: ${alert.categoryName}`, {
            description: `You've used ${alert.percentage.toFixed(1)}% of your budget. Only $${remaining.toLocaleString()} remaining.`,
            duration: 6000,
        });
    });
}

function generateAlertKey(alert: BudgetAlert): string {
    // Create a unique key for this alert based on budget ID and threshold crossed
    // This ensures we only alert once per threshold per budget per session
    return `${alert.budgetId}-${alert.status}-${Math.floor(alert.percentage / 10)}`;
}

function getShownAlerts(): string[] {
    try {
        const stored = localStorage.getItem('budget-alerts-shown');
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        
        // Clean up old alerts (older than 24 hours)
        const now = Date.now();
        const filtered = Object.entries(parsed)
            .filter(([_, timestamp]) => now - (timestamp as number) < 24 * 60 * 60 * 1000)
            .map(([key]) => key);
        
        return filtered;
    } catch {
        return [];
    }
}

function markAlertsAsShown(alerts: BudgetAlert[]) {
    try {
        const stored = localStorage.getItem('budget-alerts-shown');
        const existing = stored ? JSON.parse(stored) : {};
        
        const now = Date.now();
        alerts.forEach((alert) => {
            existing[generateAlertKey(alert)] = now;
        });
        
        localStorage.setItem('budget-alerts-shown', JSON.stringify(existing));
    } catch (error) {
        console.error('Failed to store budget alerts:', error);
    }
}

/**
 * Manually clear shown alerts (useful for testing or user preference)
 */
export function clearBudgetAlerts() {
    try {
        localStorage.removeItem('budget-alerts-shown');
        toast.success('Budget alerts reset', {
            description: 'You will see all budget alerts again.',
        });
    } catch (error) {
        console.error('Failed to clear budget alerts:', error);
    }
}
