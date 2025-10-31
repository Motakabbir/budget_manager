/**
 * Investment Queries Hook
 * Provides React Query hooks for investment portfolio management
 * Includes profit/loss calculations, ROI tracking, and portfolio analytics
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { 
    Investment, 
    InvestmentWithStats,
    CreateInvestmentParams, 
    UpdateInvestmentParams,
    PortfolioSummary,
    InvestmentBreakdown
} from '@/lib/supabase/database.types';

// Type assertion to work around missing investments table in generated types
const typedSupabase = supabase as any;

// ============================================================================
// QUERY KEYS
// ============================================================================

export const investmentKeys = {
    all: ['investments'] as const,
    lists: () => [...investmentKeys.all, 'list'] as const,
    list: (filters?: string) => [...investmentKeys.lists(), filters] as const,
    details: () => [...investmentKeys.all, 'detail'] as const,
    detail: (id: string) => [...investmentKeys.details(), id] as const,
    portfolio: () => [...investmentKeys.all, 'portfolio'] as const,
    breakdown: () => [...investmentKeys.all, 'breakdown'] as const,
    stats: () => [...investmentKeys.all, 'stats'] as const,
};

// ============================================================================
// HELPER FUNCTIONS FOR CALCULATIONS
// ============================================================================

/**
 * Calculate investment statistics including P&L, ROI, etc.
 */
export const calculateInvestmentStats = (investment: Investment): InvestmentWithStats => {
    const currentValue = investment.quantity * investment.current_price;
    const totalInvested = investment.quantity * investment.purchase_price;
    const profitLoss = currentValue - totalInvested;
    const profitLossPercentage = totalInvested > 0 
        ? ((investment.current_price - investment.purchase_price) / investment.purchase_price) * 100 
        : 0;
    
    // ROI includes dividends
    const roiPercentage = totalInvested > 0
        ? (((currentValue + investment.total_dividends_received) - totalInvested) / totalInvested) * 100
        : 0;
    
    // Days held calculation
    const purchaseDate = new Date(investment.purchase_date);
    const today = new Date();
    const daysHeld = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
        ...investment,
        current_value: currentValue,
        total_invested: totalInvested,
        profit_loss: profitLoss,
        profit_loss_percentage: profitLossPercentage,
        roi_percentage: roiPercentage,
        days_held: daysHeld,
    };
};

// ============================================================================
// FETCH HOOKS
// ============================================================================

/**
 * Fetch all investments for the current user
 */
export const useInvestments = () => {
    return useQuery({
        queryKey: investmentKeys.lists(),
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await typedSupabase
                .from('investments')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            return (data || []) as Investment[];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Fetch investments with calculated stats (P&L, ROI, etc.)
 */
export const useInvestmentsWithStats = () => {
    const { data: investments, isLoading, error } = useInvestments();
    
    const investmentsWithStats = investments?.map(calculateInvestmentStats) || [];
    
    return {
        data: investmentsWithStats,
        isLoading,
        error,
    };
};

/**
 * Fetch only active investments
 */
export const useActiveInvestments = () => {
    return useQuery({
        queryKey: [...investmentKeys.lists(), 'active'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await typedSupabase
                .from('investments')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            return (data || []) as Investment[];
        },
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Fetch single investment by ID
 */
export const useInvestment = (id: string | undefined) => {
    return useQuery({
        queryKey: investmentKeys.detail(id || ''),
        queryFn: async () => {
            if (!id) throw new Error('Investment ID is required');

            const { data, error } = await typedSupabase
                .from('investments')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            
            return data as Investment;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

// ============================================================================
// PORTFOLIO ANALYTICS HOOKS
// ============================================================================

/**
 * Get portfolio summary with totals and overall P&L
 */
export const usePortfolioSummary = (): {
    data: PortfolioSummary | null;
    isLoading: boolean;
} => {
    const { data: investments, isLoading } = useInvestments();
    
    if (isLoading || !investments) {
        return { data: null, isLoading };
    }
    
    const activeInvestments = investments.filter(inv => inv.is_active);
    
    const summary: PortfolioSummary = {
        total_investments: activeInvestments.length,
        total_invested: activeInvestments.reduce(
            (sum, inv) => sum + (inv.quantity * inv.purchase_price), 
            0
        ),
        total_current_value: activeInvestments.reduce(
            (sum, inv) => sum + (inv.quantity * inv.current_price), 
            0
        ),
        total_profit_loss: 0, // calculated below
        total_profit_loss_percentage: 0, // calculated below
        total_dividends: activeInvestments.reduce(
            (sum, inv) => sum + inv.total_dividends_received, 
            0
        ),
    };
    
    summary.total_profit_loss = summary.total_current_value - summary.total_invested;
    summary.total_profit_loss_percentage = summary.total_invested > 0
        ? (summary.total_profit_loss / summary.total_invested) * 100
        : 0;
    
    return { data: summary, isLoading: false };
};

/**
 * Get investment breakdown by type
 */
export const useInvestmentBreakdown = (): {
    data: InvestmentBreakdown[];
    isLoading: boolean;
} => {
    const { data: investments, isLoading } = useInvestments();
    
    if (isLoading || !investments) {
        return { data: [], isLoading };
    }
    
    const activeInvestments = investments.filter(inv => inv.is_active);
    const totalPortfolioValue = activeInvestments.reduce(
        (sum, inv) => sum + (inv.quantity * inv.current_price), 
        0
    );
    
    // Group by investment type
    const grouped = activeInvestments.reduce((acc, inv) => {
        const type = inv.investment_type;
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(inv);
        return acc;
    }, {} as Record<string, Investment[]>);
    
    // Calculate breakdown for each type
    const breakdown: InvestmentBreakdown[] = Object.entries(grouped).map(([type, invs]) => {
        const totalInvested = invs.reduce(
            (sum, inv) => sum + (inv.quantity * inv.purchase_price), 
            0
        );
        const totalCurrentValue = invs.reduce(
            (sum, inv) => sum + (inv.quantity * inv.current_price), 
            0
        );
        const profitLoss = totalCurrentValue - totalInvested;
        const percentageOfPortfolio = totalPortfolioValue > 0
            ? (totalCurrentValue / totalPortfolioValue) * 100
            : 0;
        
        return {
            investment_type: type as any,
            count: invs.length,
            total_invested: totalInvested,
            total_current_value: totalCurrentValue,
            profit_loss: profitLoss,
            percentage_of_portfolio: percentageOfPortfolio,
        };
    });
    
    // Sort by current value descending
    breakdown.sort((a, b) => b.total_current_value - a.total_current_value);
    
    return { data: breakdown, isLoading: false };
};

/**
 * Get top performers (investments with highest P&L %)
 */
export const useTopPerformers = (limit: number = 5) => {
    const { data: investments, isLoading } = useInvestmentsWithStats();
    
    if (isLoading || !investments) {
        return { data: [], isLoading };
    }
    
    const activeInvestments = investments.filter(inv => inv.is_active);
    const sorted = [...activeInvestments].sort(
        (a, b) => b.profit_loss_percentage - a.profit_loss_percentage
    );
    
    return { data: sorted.slice(0, limit), isLoading: false };
};

/**
 * Get worst performers (investments with lowest P&L %)
 */
export const useWorstPerformers = (limit: number = 5) => {
    const { data: investments, isLoading } = useInvestmentsWithStats();
    
    if (isLoading || !investments) {
        return { data: [], isLoading };
    }
    
    const activeInvestments = investments.filter(inv => inv.is_active);
    const sorted = [...activeInvestments].sort(
        (a, b) => a.profit_loss_percentage - b.profit_loss_percentage
    );
    
    return { data: sorted.slice(0, limit), isLoading: false };
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create new investment
 */
export const useCreateInvestment = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (params: CreateInvestmentParams) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await typedSupabase
                .from('investments')
                .insert({
                    user_id: user.id,
                    ...params,
                    total_dividends_received: 0,
                    is_active: true,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Investment;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: investmentKeys.all });
            toast.success('Investment added successfully');
        },
        onError: (error: Error) => {
            console.error('Create investment error:', error);
            toast.error('Failed to add investment: ' + error.message);
        },
    });
};

/**
 * Update existing investment
 */
export const useUpdateInvestment = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ id, params }: { id: string; params: UpdateInvestmentParams }) => {
            const { data, error } = await typedSupabase
                .from('investments')
                .update({
                    ...params,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Investment;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: investmentKeys.all });
            toast.success('Investment updated successfully');
        },
        onError: (error: Error) => {
            console.error('Update investment error:', error);
            toast.error('Failed to update investment: ' + error.message);
        },
    });
};

/**
 * Delete investment
 */
export const useDeleteInvestment = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await typedSupabase
                .from('investments')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: investmentKeys.all });
            toast.success('Investment deleted successfully');
        },
        onError: (error: Error) => {
            console.error('Delete investment error:', error);
            toast.error('Failed to delete investment: ' + error.message);
        },
    });
};

/**
 * Mark investment as sold/inactive
 */
export const useSellInvestment = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ id, salePrice }: { id: string; salePrice?: number }) => {
            const updates: UpdateInvestmentParams = {
                is_active: false,
            };
            
            // If sale price provided, update current price to match
            if (salePrice !== undefined) {
                updates.current_price = salePrice;
            }

            const { data, error } = await typedSupabase
                .from('investments')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Investment;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: investmentKeys.all });
            toast.success('Investment marked as sold');
        },
        onError: (error: Error) => {
            console.error('Sell investment error:', error);
            toast.error('Failed to sell investment: ' + error.message);
        },
    });
};

/**
 * Update dividend received for investment
 */
export const useRecordDividend = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ 
            id, 
            dividendAmount, 
            dividendDate 
        }: { 
            id: string; 
            dividendAmount: number; 
            dividendDate?: string;
        }) => {
            // First, get current investment data
            const { data: investment, error: fetchError } = await typedSupabase
                .from('investments')
                .select('total_dividends_received')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            // Update with new dividend
            const newTotal = (investment.total_dividends_received || 0) + dividendAmount;
            
            const { data, error } = await typedSupabase
                .from('investments')
                .update({
                    total_dividends_received: newTotal,
                    last_dividend_date: dividendDate || new Date().toISOString().split('T')[0],
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Investment;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: investmentKeys.all });
            toast.success('Dividend recorded successfully');
        },
        onError: (error: Error) => {
            console.error('Record dividend error:', error);
            toast.error('Failed to record dividend: ' + error.message);
        },
    });
};

// ============================================================================
// BULK UPDATE HOOKS
// ============================================================================

/**
 * Bulk update current prices (useful for daily market updates)
 */
export const useBulkUpdatePrices = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (updates: { id: string; current_price: number }[]) => {
            const promises = updates.map(({ id, current_price }) =>
                typedSupabase
                    .from('investments')
                    .update({ 
                        current_price,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id)
            );

            const results = await Promise.all(promises);
            const errors = results.filter(r => r.error);
            
            if (errors.length > 0) {
                throw new Error(`Failed to update ${errors.length} investments`);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: investmentKeys.all });
            toast.success('Prices updated successfully');
        },
        onError: (error: Error) => {
            console.error('Bulk update error:', error);
            toast.error('Failed to update prices: ' + error.message);
        },
    });
};
