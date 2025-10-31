/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */

import { supabase } from '../supabase/client';
import { NotificationService } from './notification-service';

export interface SpendingPattern {
    id: string;
    user_id: string;
    category_id: string;
    average_amount: number;
    standard_deviation: number;
    transaction_count: number;
    last_updated: string;
    created_at: string;
}

export interface TransactionAnalysis {
    transaction_id: string;
    user_id: string;
    category_id: string;
    amount: number;
    date: string;
    is_unusual: boolean;
    deviation_percentage: number;
    pattern: SpendingPattern | null;
}

export class UnusualSpendingDetector {
    private notificationService: NotificationService;

    constructor() {
        this.notificationService = new NotificationService();
    }

    /**
     * Analyze a transaction for unusual spending patterns
     */
    async analyzeTransaction(
        userId: string,
        amount: number,
        categoryId: string,
        transactionId?: string
    ): Promise<TransactionAnalysis> {
        try {
            const analysis: TransactionAnalysis = {
                transaction_id: transactionId || '',
                user_id: userId,
                category_id: categoryId,
                amount,
                date: new Date().toISOString(),
                is_unusual: false,
                deviation_percentage: 0,
                pattern: null,
            };

            // Get spending pattern for this user and category
            const { data: pattern, error } = await (supabase as any)
                .from('unusual_spending_patterns' as any)
                .select('*')
                .eq('user_id', userId)
                .eq('category_id', categoryId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                throw new Error(`Failed to fetch spending pattern: ${error.message}`);
            }

            if (pattern) {
                // Cast to SpendingPattern type
                const spendingPattern = pattern as SpendingPattern;
                analysis.pattern = spendingPattern;

                // Check if transaction is unusual (more than 2 standard deviations)
                const deviation = Math.abs(amount - spendingPattern.average_amount);
                const threshold = 2 * spendingPattern.standard_deviation;
                analysis.is_unusual = deviation > threshold;
                analysis.deviation_percentage = (deviation / spendingPattern.average_amount) * 100;

                if (analysis.is_unusual) {
                    await this.createUnusualSpendingNotification(userId, amount, categoryId, analysis.deviation_percentage);
                }
            }

            // Update spending patterns
            await this.updateSpendingPattern(userId, categoryId, amount);

            return analysis;
        } catch {
            return {
                transaction_id: transactionId || '',
                user_id: userId,
                category_id: categoryId,
                amount,
                date: new Date().toISOString(),
                is_unusual: false,
                deviation_percentage: 0,
                pattern: null,
            };
        }
    }

    /**
     * Update spending patterns with new transaction data
     */
    private async updateSpendingPattern(
        userId: string,
        categoryId: string,
        amount: number
    ): Promise<void> {
        try {
            // Get current pattern
            const { data: currentPattern, error } = await (supabase as any)
                .from('unusual_spending_patterns' as any)
                .select('*')
                .eq('user_id', userId)
                .eq('category_id', categoryId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (currentPattern) {
                // Cast to SpendingPattern type
                const pattern = currentPattern as SpendingPattern;

                // Update existing pattern
                const newCount = pattern.transaction_count + 1;
                const newAverage = ((pattern.average_amount * pattern.transaction_count) + amount) / newCount;

                // Calculate new standard deviation using Welford's online algorithm
                const oldVariance = Math.pow(pattern.standard_deviation, 2);
                const delta = amount - pattern.average_amount;
                const delta2 = amount - newAverage;
                const newVariance = ((pattern.transaction_count * oldVariance) + (delta * delta2)) / newCount;
                const newStdDev = Math.sqrt(Math.max(0, newVariance));

                await (supabase as any)
                    .from('unusual_spending_patterns' as any)
                    .update({
                        average_amount: newAverage,
                        standard_deviation: newStdDev,
                        transaction_count: newCount,
                        last_updated: new Date().toISOString(),
                    })
                    .eq('user_id', userId)
                    .eq('category_id', categoryId);
            } else {
                // Create new pattern
                await (supabase as any)
                    .from('unusual_spending_patterns' as any)
                    .insert({
                        user_id: userId,
                        category_id: categoryId,
                        average_amount: amount,
                        standard_deviation: 0,
                        transaction_count: 1,
                        last_updated: new Date().toISOString(),
                    });
            }
        } catch {
            // Silently fail - pattern updates are not critical
        }
    }

    /**
     * Create notification for unusual spending
     */
    private async createUnusualSpendingNotification(
        userId: string,
        amount: number,
        categoryId: string,
        deviationPercentage: number
    ): Promise<void> {
        try {
            // Get category name for better notification message
            const { data: category, error: categoryError } = await supabase
                .from('categories')
                .select('name')
                .eq('id', categoryId)
                .single();

            if (categoryError) {
                console.error('Error fetching category:', categoryError);
            }

            const categoryName = category?.name || 'Unknown Category';

            await this.notificationService.createUnusualSpendingAlert(
                userId,
                amount,
                categoryName,
                deviationPercentage
            );
        } catch {
            // Silently fail - notifications are not critical
        }
    }

    /**
     * Get all spending patterns for a user
     */
    async getUserSpendingPatterns(userId: string): Promise<SpendingPattern[]> {
        try {
            const { data: patterns, error } = await (supabase as any)
                .from('unusual_spending_patterns' as any)
                .select('*')
                .eq('user_id', userId)
                .order('last_updated', { ascending: false });

            if (error) {
                throw error;
            }

            return (patterns || []) as SpendingPattern[];
        } catch {
            return [];
        }
    }

    /**
     * Get spending insights for a user
     */
    async getSpendingInsights(userId: string): Promise<{
        total_patterns: number;
        categories_tracked: number;
        average_transactions_per_category: number;
        most_variable_category: { category_id: string; standard_deviation: number } | null;
    }> {
        try {
            const patterns = await this.getUserSpendingPatterns(userId);

            if (patterns.length === 0) {
                return {
                    total_patterns: 0,
                    categories_tracked: 0,
                    average_transactions_per_category: 0,
                    most_variable_category: null,
                };
            }

            const totalTransactions = patterns.reduce((sum, pattern) => sum + pattern.transaction_count, 0);
            const mostVariable = patterns.reduce((max, pattern) =>
                pattern.standard_deviation > (max?.standard_deviation || 0) ? pattern : max,
                null as SpendingPattern | null
            );

            return {
                total_patterns: patterns.length,
                categories_tracked: patterns.length,
                average_transactions_per_category: totalTransactions / patterns.length,
                most_variable_category: mostVariable ? {
                    category_id: mostVariable.category_id,
                    standard_deviation: mostVariable.standard_deviation,
                } : null,
            };
        } catch {
            return {
                total_patterns: 0,
                categories_tracked: 0,
                average_transactions_per_category: 0,
                most_variable_category: null,
            };
        }
    }

    /**
     * Reset spending patterns for a user (useful for testing or user request)
     */
    async resetUserPatterns(userId: string): Promise<void> {
        try {
            await (supabase as any)
                .from('unusual_spending_patterns' as any)
                .delete()
                .eq('user_id', userId);
        } catch {
            // Silently fail
        }
    }

    /**
     * Analyze recent transactions for unusual spending
     */
    async analyzeRecentTransactions(userId: string, days: number = 30): Promise<TransactionAnalysis[]> {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const { data: transactions, error } = await supabase
                .from('transactions')
                .select('id, amount, category_id, date')
                .eq('user_id', userId)
                .eq('type', 'expense')
                .gte('date', startDate.toISOString())
                .order('date', { ascending: false });

            if (error) {
                throw error;
            }

            const analyses: TransactionAnalysis[] = [];

            for (const transaction of transactions || []) {
                const analysis = await this.analyzeTransaction(
                    userId,
                    transaction.amount,
                    transaction.category_id,
                    transaction.id
                );
                analyses.push(analysis);
            }

            return analyses;
        } catch {
            return [];
        }
    }
}