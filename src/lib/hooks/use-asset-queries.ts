/**
 * Asset Queries Hook
 * Provides React Query hooks for fixed asset management
 * Includes depreciation tracking, insurance/warranty monitoring, and asset analytics
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { 
    Asset, 
    AssetWithStats,
    CreateAssetParams, 
    UpdateAssetParams,
    AssetsSummary,
    AssetBreakdown,
    AssetDepreciation,
    ExpiringCoverage
} from '@/lib/supabase/database.types';

// Type assertion to work around missing assets table in generated types
const typedSupabase = supabase as any;

// ============================================================================
// QUERY KEYS
// ============================================================================

export const assetKeys = {
    all: ['assets'] as const,
    lists: () => [...assetKeys.all, 'list'] as const,
    list: (filters?: string) => [...assetKeys.lists(), filters] as const,
    details: () => [...assetKeys.all, 'detail'] as const,
    detail: (id: string) => [...assetKeys.details(), id] as const,
    summary: () => [...assetKeys.all, 'summary'] as const,
    breakdown: () => [...assetKeys.all, 'breakdown'] as const,
    depreciation: (id: string) => [...assetKeys.all, 'depreciation', id] as const,
    expiring: () => [...assetKeys.all, 'expiring'] as const,
};

// ============================================================================
// HELPER FUNCTIONS FOR CALCULATIONS
// ============================================================================

/**
 * Calculate asset statistics including depreciation, age, etc.
 */
export const calculateAssetStats = (asset: Asset): AssetWithStats => {
    const totalDepreciation = asset.purchase_price - asset.current_value;
    const depreciationPercentage = asset.purchase_price > 0
        ? (totalDepreciation / asset.purchase_price) * 100
        : 0;
    
    // Age calculations
    const purchaseDate = new Date(asset.purchase_date);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - purchaseDate.getFullYear()) * 12 + 
                        (today.getMonth() - purchaseDate.getMonth());
    const ageYears = Math.floor(ageInMonths / 12);
    const ageMonths = ageInMonths % 12;
    
    // Average annual depreciation
    const avgAnnualDepreciation = ageYears > 0 
        ? totalDepreciation / ageYears 
        : 0;
    
    // Sale profit/loss (if sold)
    const saleProfitLoss = asset.sale_price && !asset.is_active
        ? asset.sale_price - asset.current_value
        : null;
    
    // Insurance status
    let insuranceStatus: 'active' | 'expired' | 'expiring_soon' | 'not_insured' = 'not_insured';
    if (asset.is_insured && asset.insurance_expiry_date) {
        const expiryDate = new Date(asset.insurance_expiry_date);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
            insuranceStatus = 'expired';
        } else if (daysUntilExpiry <= 30) {
            insuranceStatus = 'expiring_soon';
        } else {
            insuranceStatus = 'active';
        }
    }
    
    // Warranty status
    let warrantyStatus: 'active' | 'expired' | 'expiring_soon' | 'no_warranty' = 'no_warranty';
    if (asset.warranty_expiry_date) {
        const warrantyDate = new Date(asset.warranty_expiry_date);
        const daysUntilExpiry = Math.floor((warrantyDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
            warrantyStatus = 'expired';
        } else if (daysUntilExpiry <= 30) {
            warrantyStatus = 'expiring_soon';
        } else {
            warrantyStatus = 'active';
        }
    }
    
    return {
        ...asset,
        total_depreciation: totalDepreciation,
        depreciation_percentage: depreciationPercentage,
        age_years: ageYears,
        age_months: ageMonths,
        avg_annual_depreciation: avgAnnualDepreciation,
        sale_profit_loss: saleProfitLoss,
        insurance_status: insuranceStatus,
        warranty_status: warrantyStatus,
    };
};

// ============================================================================
// FETCH HOOKS
// ============================================================================

/**
 * Fetch all assets for the current user
 */
export const useAssets = () => {
    return useQuery({
        queryKey: assetKeys.lists(),
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await typedSupabase
                .from('assets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            return (data || []) as Asset[];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Fetch assets with calculated stats (depreciation, age, etc.)
 */
export const useAssetsWithStats = () => {
    const { data: assets, isLoading, error } = useAssets();
    
    const assetsWithStats = assets?.map(calculateAssetStats) || [];
    
    return {
        data: assetsWithStats,
        isLoading,
        error,
    };
};

/**
 * Fetch only active assets
 */
export const useActiveAssets = () => {
    return useQuery({
        queryKey: [...assetKeys.lists(), 'active'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await typedSupabase
                .from('assets')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            return (data || []) as Asset[];
        },
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Fetch single asset by ID
 */
export const useAsset = (id: string | undefined) => {
    return useQuery({
        queryKey: assetKeys.detail(id || ''),
        queryFn: async () => {
            if (!id) throw new Error('Asset ID is required');

            const { data, error } = await typedSupabase
                .from('assets')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            
            return data as Asset;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

// ============================================================================
// ASSET ANALYTICS HOOKS
// ============================================================================

/**
 * Get assets summary with totals and depreciation
 */
export const useAssetsSummary = (): {
    data: AssetsSummary | null;
    isLoading: boolean;
} => {
    const { data: assets, isLoading } = useAssets();
    
    if (isLoading || !assets) {
        return { data: null, isLoading };
    }
    
    const activeAssets = assets.filter(asset => asset.is_active);
    
    const summary: AssetsSummary = {
        total_assets: activeAssets.length,
        total_purchase_price: activeAssets.reduce((sum, asset) => sum + asset.purchase_price, 0),
        total_current_value: activeAssets.reduce((sum, asset) => sum + asset.current_value, 0),
        total_depreciation: 0, // calculated below
        total_insured_value: activeAssets
            .filter(asset => asset.is_insured)
            .reduce((sum, asset) => sum + asset.current_value, 0),
        assets_insured_count: activeAssets.filter(asset => asset.is_insured).length,
    };
    
    summary.total_depreciation = summary.total_purchase_price - summary.total_current_value;
    
    return { data: summary, isLoading: false };
};

/**
 * Get asset breakdown by type
 */
export const useAssetBreakdown = (): {
    data: AssetBreakdown[];
    isLoading: boolean;
} => {
    const { data: assets, isLoading } = useAssets();
    
    if (isLoading || !assets) {
        return { data: [], isLoading };
    }
    
    const activeAssets = assets.filter(asset => asset.is_active);
    const totalValue = activeAssets.reduce((sum, asset) => sum + asset.current_value, 0);
    
    // Group by asset type
    const grouped = activeAssets.reduce((acc, asset) => {
        const type = asset.asset_type;
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(asset);
        return acc;
    }, {} as Record<string, Asset[]>);
    
    // Calculate breakdown for each type
    const breakdown: AssetBreakdown[] = Object.entries(grouped).map(([type, assts]) => {
        const totalPurchasePrice = assts.reduce((sum, asset) => sum + asset.purchase_price, 0);
        const totalCurrentValue = assts.reduce((sum, asset) => sum + asset.current_value, 0);
        const totalDepreciation = totalPurchasePrice - totalCurrentValue;
        const percentageOfTotal = totalValue > 0
            ? (totalCurrentValue / totalValue) * 100
            : 0;
        
        return {
            asset_type: type as any,
            count: assts.length,
            total_purchase_price: totalPurchasePrice,
            total_current_value: totalCurrentValue,
            total_depreciation: totalDepreciation,
            percentage_of_total: percentageOfTotal,
        };
    });
    
    // Sort by current value descending
    breakdown.sort((a, b) => b.total_current_value - a.total_current_value);
    
    return { data: breakdown, isLoading: false };
};

/**
 * Get assets with expiring insurance or warranties
 */
export const useExpiringCoverage = (daysAhead: number = 30) => {
    return useQuery({
        queryKey: [...assetKeys.expiring(), daysAhead],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await typedSupabase
                .rpc('get_expiring_coverage', {
                    p_user_id: user.id,
                    p_days_ahead: daysAhead,
                });

            if (error) throw error;
            
            return (data || []) as ExpiringCoverage[];
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

/**
 * Get assets that need maintenance/attention
 */
export const useAssetsNeedingAttention = () => {
    const { data: assets, isLoading } = useAssetsWithStats();
    
    if (isLoading || !assets) {
        return { data: [], isLoading };
    }
    
    const needsAttention = assets.filter(asset => 
        asset.is_active && (
            asset.insurance_status === 'expired' ||
            asset.insurance_status === 'expiring_soon' ||
            asset.warranty_status === 'expired' ||
            asset.warranty_status === 'expiring_soon'
        )
    );
    
    return { data: needsAttention, isLoading: false };
};

/**
 * Get most valuable assets
 */
export const useMostValuableAssets = (limit: number = 5) => {
    const { data: assets, isLoading } = useAssets();
    
    if (isLoading || !assets) {
        return { data: [], isLoading };
    }
    
    const activeAssets = assets.filter(asset => asset.is_active);
    const sorted = [...activeAssets].sort((a, b) => b.current_value - a.current_value);
    
    return { data: sorted.slice(0, limit), isLoading: false };
};

/**
 * Get most depreciated assets (by percentage)
 */
export const useMostDepreciatedAssets = (limit: number = 5) => {
    const { data: assets, isLoading } = useAssetsWithStats();
    
    if (isLoading || !assets) {
        return { data: [], isLoading };
    }
    
    const activeAssets = assets.filter(asset => asset.is_active);
    const sorted = [...activeAssets].sort(
        (a, b) => b.depreciation_percentage - a.depreciation_percentage
    );
    
    return { data: sorted.slice(0, limit), isLoading: false };
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create new asset
 */
export const useCreateAsset = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (params: CreateAssetParams) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await typedSupabase
                .from('assets')
                .insert({
                    user_id: user.id,
                    ...params,
                    is_active: true,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Asset;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
            toast.success('Asset added successfully');
        },
        onError: (error: Error) => {
            console.error('Create asset error:', error);
            toast.error('Failed to add asset: ' + error.message);
        },
    });
};

/**
 * Update existing asset
 */
export const useUpdateAsset = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ id, params }: { id: string; params: UpdateAssetParams }) => {
            const { data, error } = await typedSupabase
                .from('assets')
                .update({
                    ...params,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Asset;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
            toast.success('Asset updated successfully');
        },
        onError: (error: Error) => {
            console.error('Update asset error:', error);
            toast.error('Failed to update asset: ' + error.message);
        },
    });
};

/**
 * Delete asset
 */
export const useDeleteAsset = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await typedSupabase
                .from('assets')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
            toast.success('Asset deleted successfully');
        },
        onError: (error: Error) => {
            console.error('Delete asset error:', error);
            toast.error('Failed to delete asset: ' + error.message);
        },
    });
};

/**
 * Mark asset as sold
 */
export const useSellAsset = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ 
            id, 
            salePrice, 
            saleDate 
        }: { 
            id: string; 
            salePrice: number; 
            saleDate?: string;
        }) => {
            const { data, error } = await typedSupabase
                .from('assets')
                .update({
                    is_active: false,
                    sale_price: salePrice,
                    sale_date: saleDate || new Date().toISOString().split('T')[0],
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Asset;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
            toast.success('Asset marked as sold');
        },
        onError: (error: Error) => {
            console.error('Sell asset error:', error);
            toast.error('Failed to sell asset: ' + error.message);
        },
    });
};

/**
 * Update asset insurance
 */
export const useUpdateAssetInsurance = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({
            id,
            provider,
            policyNumber,
            expiryDate,
            premium,
        }: {
            id: string;
            provider: string;
            policyNumber: string;
            expiryDate: string;
            premium?: number;
        }) => {
            const { data, error } = await typedSupabase
                .from('assets')
                .update({
                    is_insured: true,
                    insurance_provider: provider,
                    insurance_policy_number: policyNumber,
                    insurance_expiry_date: expiryDate,
                    insurance_premium: premium,
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Asset;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
            toast.success('Insurance updated successfully');
        },
        onError: (error: Error) => {
            console.error('Update insurance error:', error);
            toast.error('Failed to update insurance: ' + error.message);
        },
    });
};

/**
 * Bulk update asset values (useful for periodic revaluation)
 */
export const useBulkUpdateAssetValues = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (updates: { id: string; current_value: number }[]) => {
            const promises = updates.map(({ id, current_value }) =>
                typedSupabase
                    .from('assets')
                    .update({ 
                        current_value,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id)
            );

            const results = await Promise.all(promises);
            const errors = results.filter(r => r.error);
            
            if (errors.length > 0) {
                throw new Error(`Failed to update ${errors.length} assets`);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
            toast.success('Asset values updated successfully');
        },
        onError: (error: Error) => {
            console.error('Bulk update error:', error);
            toast.error('Failed to update values: ' + error.message);
        },
    });
};
