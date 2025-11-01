import type { Transaction, Category } from '@/lib/hooks/use-budget-queries';

export interface BudgetAllocation {
    needs: number;
    wants: number;
    savings: number;
}

export interface CategoryAllocation {
    categoryId: string;
    categoryName: string;
    type: 'needs' | 'wants' | 'savings';
    currentSpending: number;
    allocatedBudget: number;
    utilizationPercentage: number;
}

export interface BudgetSummary {
    totalIncome: number;
    allocation: BudgetAllocation;
    categoryBreakdown: CategoryAllocation[];
    needsUtilization: number;
    wantsUtilization: number;
    savingsUtilization: number;
    isBalanced: boolean;
    recommendations: string[];
}

/**
 * Budget Allocation Service
 * Implements 50/30/20 rule and provides budget recommendations
 */
export class BudgetAllocationService {
    /**
     * Calculate 50/30/20 budget allocation based on total income
     * @param totalIncome - Total monthly income
     * @returns Allocation breakdown
     */
    static calculate503020Allocation(totalIncome: number): BudgetAllocation {
        return {
            needs: totalIncome * 0.5,    // 50% for needs
            wants: totalIncome * 0.3,    // 30% for wants
            savings: totalIncome * 0.2,  // 20% for savings
        };
    }

    /**
     * Calculate custom budget allocation based on user preferences
     * @param totalIncome - Total monthly income
     * @param needsPercentage - Percentage for needs (0-100)
     * @param wantsPercentage - Percentage for wants (0-100)
     * @param savingsPercentage - Percentage for savings (0-100)
     * @returns Allocation breakdown
     */
    static calculateCustomAllocation(
        totalIncome: number,
        needsPercentage: number,
        wantsPercentage: number,
        savingsPercentage: number
    ): BudgetAllocation {
        // Ensure percentages add up to 100
        const total = needsPercentage + wantsPercentage + savingsPercentage;
        if (Math.abs(total - 100) > 0.01) {
            throw new Error('Percentages must add up to 100%');
        }

        return {
            needs: totalIncome * (needsPercentage / 100),
            wants: totalIncome * (wantsPercentage / 100),
            savings: totalIncome * (savingsPercentage / 100),
        };
    }

    /**
     * Categorize spending into needs, wants, or savings
     * @param category - Category to classify
     * @returns Type of spending
     */
    static classifyCategory(category: Category): 'needs' | 'wants' | 'savings' {
        const categoryName = category.name.toLowerCase();
        
        // Needs: Essential expenses
        const needsKeywords = [
            'rent', 'mortgage', 'utilities', 'groceries', 'food', 'health',
            'insurance', 'transportation', 'gas', 'fuel', 'medicine', 
            'medical', 'electricity', 'water', 'internet', 'phone', 
            'childcare', 'education', 'debt', 'loan', 'emi'
        ];

        // Savings: Investments and savings
        const savingsKeywords = [
            'savings', 'investment', 'retirement', 'emergency', 'fund',
            'stock', 'mutual', 'bond', 'crypto', 'deposit'
        ];

        // Check if it's a need
        if (needsKeywords.some(keyword => categoryName.includes(keyword))) {
            return 'needs';
        }

        // Check if it's savings
        if (savingsKeywords.some(keyword => categoryName.includes(keyword))) {
            return 'savings';
        }

        // Everything else is a want
        return 'wants';
    }

    /**
     * Generate comprehensive budget summary with recommendations
     * @param transactions - All transactions
     * @param categories - All categories
     * @param totalIncome - Total monthly income
     * @param startDate - Start date for analysis
     * @param endDate - End date for analysis
     * @returns Budget summary with recommendations
     */
    static generateBudgetSummary(
        transactions: Transaction[],
        categories: Category[],
        totalIncome: number,
        startDate: Date,
        endDate: Date
    ): BudgetSummary {
        // Calculate ideal 50/30/20 allocation
        const allocation = this.calculate503020Allocation(totalIncome);

        // Filter transactions in date range
        const filteredTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });

        // Calculate spending by category type
        const categoryMap = new Map(categories.map(c => [c.id, c]));
        const categoryBreakdown: Map<string, CategoryAllocation> = new Map();

        let needsSpending = 0;
        let wantsSpending = 0;
        let savingsSpending = 0;

        filteredTransactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                const category = categoryMap.get(transaction.category_id);
                if (!category) return;

                const allocationType = this.classifyCategory(category);
                const amount = transaction.amount;

                // Update category breakdown
                if (!categoryBreakdown.has(category.id)) {
                    categoryBreakdown.set(category.id, {
                        categoryId: category.id,
                        categoryName: category.name,
                        type: allocationType,
                        currentSpending: 0,
                        allocatedBudget: 0,
                        utilizationPercentage: 0,
                    });
                }
                
                const categoryData = categoryBreakdown.get(category.id)!;
                categoryData.currentSpending += amount;

                // Update totals
                switch (allocationType) {
                    case 'needs':
                        needsSpending += amount;
                        break;
                    case 'wants':
                        wantsSpending += amount;
                        break;
                    case 'savings':
                        savingsSpending += amount;
                        break;
                }
            }
        });

        // Calculate utilization percentages
        const needsUtilization = allocation.needs > 0 ? (needsSpending / allocation.needs) * 100 : 0;
        const wantsUtilization = allocation.wants > 0 ? (wantsSpending / allocation.wants) * 100 : 0;
        const savingsUtilization = allocation.savings > 0 ? (savingsSpending / allocation.savings) * 100 : 0;

        // Update category allocations based on type
        categoryBreakdown.forEach(cat => {
            switch (cat.type) {
                case 'needs':
                    cat.allocatedBudget = allocation.needs;
                    break;
                case 'wants':
                    cat.allocatedBudget = allocation.wants;
                    break;
                case 'savings':
                    cat.allocatedBudget = allocation.savings;
                    break;
            }
            cat.utilizationPercentage = cat.allocatedBudget > 0 
                ? (cat.currentSpending / cat.allocatedBudget) * 100 
                : 0;
        });

        // Check if budget is balanced (within 10% of ideal)
        const isBalanced = 
            Math.abs(needsUtilization - 100) <= 10 &&
            Math.abs(wantsUtilization - 100) <= 10 &&
            Math.abs(savingsUtilization - 100) <= 10;

        // Generate recommendations
        const recommendations = this.generateRecommendations(
            needsUtilization,
            wantsUtilization,
            savingsUtilization,
            allocation,
            needsSpending,
            wantsSpending,
            savingsSpending
        );

        return {
            totalIncome,
            allocation,
            categoryBreakdown: Array.from(categoryBreakdown.values()),
            needsUtilization,
            wantsUtilization,
            savingsUtilization,
            isBalanced,
            recommendations,
        };
    }

    /**
     * Generate budget recommendations based on spending patterns
     */
    private static generateRecommendations(
        needsUtilization: number,
        wantsUtilization: number,
        savingsUtilization: number,
        allocation: BudgetAllocation,
        needsSpending: number,
        wantsSpending: number,
        savingsSpending: number
    ): string[] {
        const recommendations: string[] = [];

        // Needs recommendations
        if (needsUtilization > 110) {
            const excess = needsSpending - allocation.needs;
            recommendations.push(
                `⚠️ Needs spending is ${needsUtilization.toFixed(0)}% of budget. Consider reducing by $${excess.toFixed(2)} or increasing income.`
            );
        } else if (needsUtilization < 40) {
            recommendations.push(
                `✅ Needs spending is well under control at ${needsUtilization.toFixed(0)}%.`
            );
        }

        // Wants recommendations
        if (wantsUtilization > 120) {
            const excess = wantsSpending - allocation.wants;
            recommendations.push(
                `⚠️ Wants spending is ${wantsUtilization.toFixed(0)}% over budget. Cut back by $${excess.toFixed(2)} on discretionary expenses.`
            );
        } else if (wantsUtilization > 100) {
            recommendations.push(
                `⚡ Wants spending is slightly over. Consider reducing entertainment, dining out, or shopping.`
            );
        } else if (wantsUtilization < 50) {
            recommendations.push(
                `💡 You have room in your wants budget! Consider treating yourself or reallocating to savings.`
            );
        }

        // Savings recommendations
        if (savingsUtilization < 50) {
            const shortfall = allocation.savings - savingsSpending;
            recommendations.push(
                `📈 You're saving less than recommended. Try to save an additional $${shortfall.toFixed(2)} per month.`
            );
        } else if (savingsUtilization > 100) {
            recommendations.push(
                `🎉 Excellent! You're exceeding your savings goal! Consider increasing your target.`
            );
        } else {
            recommendations.push(
                `✅ Savings on track at ${savingsUtilization.toFixed(0)}% of target.`
            );
        }

        // Overall budget health
        const totalSpending = needsSpending + wantsSpending + savingsSpending;
        const totalBudget = allocation.needs + allocation.wants + allocation.savings;
        const overallUtilization = (totalSpending / totalBudget) * 100;

        if (overallUtilization > 100) {
            recommendations.push(
                `🚨 Overall spending is ${overallUtilization.toFixed(0)}% of budget. You're overspending - review all categories.`
            );
        } else if (overallUtilization < 80) {
            recommendations.push(
                `💰 You're spending only ${overallUtilization.toFixed(0)}% of budget. Great job! Consider increasing savings goals.`
            );
        }

        return recommendations;
    }

    /**
     * Calculate zero-based budget (allocate every dollar)
     * @param totalIncome - Total monthly income
     * @param expenses - Planned expenses
     * @returns Unallocated amount
     */
    static calculateZeroBasedBudget(
        totalIncome: number,
        expenses: { category: string; amount: number }[]
    ): { allocated: number; unallocated: number; categories: typeof expenses } {
        const allocated = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const unallocated = totalIncome - allocated;

        return {
            allocated,
            unallocated,
            categories: expenses,
        };
    }
}
