import { supabase } from '@/lib/supabase/client';
import type { NotificationType, NotificationPriority } from '@/lib/hooks/use-notifications';

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    icon?: string;
    priority?: NotificationPriority;
    actionUrl?: string;
    metadata?: Record<string, any>;
    expiresInDays?: number;
}

export async function createNotification({
    userId,
    type,
    title,
    message,
    icon,
    priority = 'normal',
    actionUrl,
    metadata,
    expiresInDays,
}: CreateNotificationParams) {
    const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const { data, error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            type,
            title,
            message,
            icon,
            priority,
            action_url: actionUrl,
            metadata,
            expires_at: expiresAt,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Budget alert generators
export async function checkBudgetAlerts(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    // Get category budgets
    const { data: budgets } = await supabase
        .from('category_budgets')
        .select('*, categories(name, color)')
        .eq('user_id', userId)
        .eq('period', 'monthly');

    if (!budgets) return;

    // Get current month's spending per category
    const { data: transactions } = await supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

    if (!transactions) return;

    // Calculate spending per category
    const spendingByCategory = transactions.reduce((acc: Record<string, number>, t: any) => {
        acc[t.category_id] = (acc[t.category_id] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

    // Check each budget
    for (const budget of budgets) {
        const spent = spendingByCategory[budget.category_id] || 0;
        const percentage = (spent / budget.amount) * 100;
        const categoryName = budget.categories?.name || 'Unknown';

        // Budget exceeded
        if (percentage >= 100) {
            await createNotification({
                userId,
                type: 'budget_alert',
                title: '⚠️ Budget Exceeded!',
                message: `You've spent $${spent.toFixed(2)} of $${budget.amount} in '${categoryName}' this month (${percentage.toFixed(0)}%)`,
                icon: '⚠️',
                priority: 'urgent',
                actionUrl: '/expenses',
                metadata: { categoryId: budget.category_id, spent, budget: budget.amount },
            });
        }
        // Budget warning at 90%
        else if (percentage >= 90 && percentage < 100) {
            await createNotification({
                userId,
                type: 'budget_warning',
                title: '⚡ Budget Warning',
                message: `You've used ${percentage.toFixed(0)}% of your '${categoryName}' budget ($${spent.toFixed(2)} of $${budget.amount})`,
                icon: '⚡',
                priority: 'high',
                actionUrl: '/expenses',
                metadata: { categoryId: budget.category_id, spent, budget: budget.amount },
            });
        }
        // Budget warning at 75%
        else if (percentage >= 75 && percentage < 90) {
            await createNotification({
                userId,
                type: 'budget_warning',
                title: '📊 Budget Update',
                message: `You've used ${percentage.toFixed(0)}% of your '${categoryName}' budget ($${spent.toFixed(2)} of $${budget.amount})`,
                icon: '📊',
                priority: 'normal',
                actionUrl: '/expenses',
                metadata: { categoryId: budget.category_id, spent, budget: budget.amount },
            });
        }
    }
}

// Savings goal notifications
export async function checkSavingsGoalMilestones(userId: string) {
    const { data: goals } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', userId);

    if (!goals) return;

    for (const goal of goals) {
        const percentage = (goal.current_amount / goal.target_amount) * 100;

        // Goal achieved
        if (percentage >= 100) {
            await createNotification({
                userId,
                type: 'goal_achieved',
                title: '🎉 Goal Achieved!',
                message: `Congratulations! You've reached your '${goal.name}' goal of $${goal.target_amount}!`,
                icon: '🎉',
                priority: 'high',
                actionUrl: '/settings',
                metadata: { goalId: goal.id },
            });
        }
        // Milestone notifications (25%, 50%, 75%)
        else if (percentage >= 75 && percentage < 100) {
            await createNotification({
                userId,
                type: 'goal_milestone',
                title: '🎯 Almost There!',
                message: `75% progress on '${goal.name}' - $${goal.current_amount} of $${goal.target_amount}`,
                icon: '🎯',
                priority: 'normal',
                actionUrl: '/settings',
                metadata: { goalId: goal.id, percentage },
            });
        } else if (percentage >= 50 && percentage < 75) {
            await createNotification({
                userId,
                type: 'goal_milestone',
                title: '📈 Halfway There!',
                message: `50% progress on '${goal.name}' - $${goal.current_amount} of $${goal.target_amount}`,
                icon: '📈',
                priority: 'normal',
                actionUrl: '/settings',
                metadata: { goalId: goal.id, percentage },
            });
        }

        // Deadline approaching
        if (goal.deadline) {
            const daysUntilDeadline = Math.ceil(
                (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilDeadline <= 7 && daysUntilDeadline > 0 && percentage < 100) {
                await createNotification({
                    userId,
                    type: 'goal_deadline',
                    title: '⏰ Deadline Approaching',
                    message: `Only ${daysUntilDeadline} days left to reach your '${goal.name}' goal. Current: $${goal.current_amount} / $${goal.target_amount}`,
                    icon: '⏰',
                    priority: 'high',
                    actionUrl: '/settings',
                    metadata: { goalId: goal.id, daysLeft: daysUntilDeadline },
                });
            }
        }
    }
}

// Spending insights
export async function generateSpendingInsights(userId: string) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    // Get this month's expenses
    const { data: thisMonthExpenses } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', thisMonthStart);

    // Get last month's expenses
    const { data: lastMonthExpenses } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', lastMonthStart)
        .lte('date', lastMonthEnd);

    if (!thisMonthExpenses || !lastMonthExpenses) return;

    const thisMonthTotal = thisMonthExpenses.reduce((sum: number, t: any) => sum + t.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum: number, t: any) => sum + t.amount, 0);

    const difference = thisMonthTotal - lastMonthTotal;
    const percentageChange = lastMonthTotal > 0 ? (difference / lastMonthTotal) * 100 : 0;

    if (Math.abs(percentageChange) > 20) {
        const isIncrease = difference > 0;
        await createNotification({
            userId,
            type: 'spending_insight',
            title: isIncrease ? '📈 Spending Increased' : '📉 Spending Decreased',
            message: isIncrease
                ? `Your spending is ${percentageChange.toFixed(0)}% higher than last month ($${Math.abs(difference).toFixed(2)} more)`
                : `Great job! You've spent ${Math.abs(percentageChange).toFixed(0)}% less than last month ($${Math.abs(difference).toFixed(2)} saved)`,
            icon: isIncrease ? '📈' : '📉',
            priority: 'normal',
            actionUrl: '/dashboard',
            metadata: { thisMonth: thisMonthTotal, lastMonth: lastMonthTotal },
        });
    }
}

// Daily tips
export async function generateDailyTip(userId: string) {
    const tips = [
        { title: '💡 Savings Tip', message: 'Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings', icon: '💡' },
        { title: '💰 Smart Spending', message: 'Review your subscriptions - cancel unused services to save money', icon: '💰' },
        { title: '🎯 Goal Setting', message: 'Set specific, measurable financial goals to stay motivated', icon: '🎯' },
        { title: '📊 Track Progress', message: 'Review your budget weekly to stay on track', icon: '📊' },
        { title: '🏦 Emergency Fund', message: 'Aim to save 3-6 months of expenses for emergencies', icon: '🏦' },
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    await createNotification({
        userId,
        type: 'tip',
        ...randomTip,
        priority: 'low',
        expiresInDays: 1,
    });
}
