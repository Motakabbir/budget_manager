import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { transactionSchema, categorySchema, savingsGoalSchema, categoryBudgetSchema, userSettingsSchema } from '@/lib/validations/schemas';
import type { TransactionInput, CategoryInput, SavingsGoalInput, CategoryBudgetInput, UserSettingsInput } from '@/lib/validations/schemas';

// ============= TYPES =============

export type Category = {
    id: string;
    user_id: string;
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string | null;
    created_at: string;
    updated_at: string;
};

export type Transaction = {
    id: string;
    user_id: string;
    category_id: string;
    amount: number;
    description: string | null;
    date: string;
    type: 'income' | 'expense';
    created_at: string;
    updated_at: string;
    category?: Category | null;
};

export type SavingsGoal = {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string | null;
    created_at: string;
    updated_at: string;
};

export type UserSettings = {
    id: string;
    user_id: string;
    opening_balance: number;
    opening_date: string;
    created_at: string;
    updated_at: string;
};

export type CategoryBudget = {
    id: string;
    user_id: string;
    category_id: string;
    amount: number;
    period: 'monthly' | 'yearly';
    created_at: string;
    updated_at: string;
};

// Query Keys
export const queryKeys = {
    transactions: (startDate?: string, endDate?: string) => ['transactions', startDate, endDate] as const,
    categories: ['categories'] as const,
    savingsGoals: ['savingsGoals'] as const,
    userSettings: ['userSettings'] as const,
    categoryBudgets: ['categoryBudgets'] as const,
};

// ============= CATEGORIES =============

export function useCategories() {
    return useQuery<Category[]>({
        queryKey: queryKeys.categories,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', user.id)
                .order('name');

            if (error) throw error;
            return data;
        },
    });
}

export function useAddCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CategoryInput) => {
            const validated = categorySchema.parse(input);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('categories')
                .insert({ ...validated, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.categories });
            toast.success('Category created successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to create category', { description: error.message });
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<CategoryInput> }) => {
            const { data, error } = await supabase
                .from('categories')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.categories });
            toast.success('Category updated successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to update category', { description: error.message });
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.categories });
            toast.success('Category deleted successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to delete category', { description: error.message });
        },
    });
}

// ============= TRANSACTIONS =============

export function useTransactions(startDate?: string, endDate?: string) {
    return useQuery<Transaction[]>({
        queryKey: queryKeys.transactions(startDate, endDate),
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let query = supabase
                .from('transactions')
                .select(`
                    *,
                    category:categories(*)
                `)
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (startDate) query = query.gte('date', startDate);
            if (endDate) query = query.lte('date', endDate);

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
    });
}

export function useAddTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: Omit<TransactionInput, 'date'> & { date: string }) => {
            // Validate input with Zod
            const validated = transactionSchema.parse({
                ...input,
                date: new Date(input.date),
            });

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('transactions')
                .insert({ ...input, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            const type = variables.type === 'income' ? 'Income' : 'Expense';
            toast.success(`${type} added successfully`, {
                description: `$${variables.amount.toFixed(2)}`,
            });
        },
        onError: (error: Error) => {
            toast.error('Failed to add transaction', { description: error.message });
        },
    });
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<TransactionInput, 'date'> & { date: string }> }) => {
            const { data, error } = await supabase
                .from('transactions')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            toast.success('Transaction updated successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to update transaction', { description: error.message });
        },
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            toast.success('Transaction deleted successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to delete transaction', { description: error.message });
        },
    });
}

// ============= SAVINGS GOALS =============

export function useSavingsGoals() {
    return useQuery<SavingsGoal[]>({
        queryKey: queryKeys.savingsGoals,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('savings_goals')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
    });
}

export function useAddSavingsGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: Omit<SavingsGoalInput, 'deadline'> & { deadline: string | null }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('savings_goals')
                .insert({ ...input, user_id: user.id, current_amount: 0 })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoals });
            toast.success('Savings goal created successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to create savings goal', { description: error.message });
        },
    });
}

export function useUpdateSavingsGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<any> }) => {
            const { data, error } = await supabase
                .from('savings_goals')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoals });
            toast.success('Savings goal updated successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to update savings goal', { description: error.message });
        },
    });
}

export function useDeleteSavingsGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('savings_goals')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoals });
            toast.success('Savings goal deleted successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to delete savings goal', { description: error.message });
        },
    });
}

// ============= USER SETTINGS =============

export function useUserSettings() {
    return useQuery<UserSettings | null>({
        queryKey: queryKeys.userSettings,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // Ignore not found error
            return data;
        },
    });
}

export function useSaveUserSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: { opening_balance: number; opening_date: string }) => {
            // Validate input with Zod
            const validated = userSettingsSchema.parse({
                ...input,
                opening_date: new Date(input.opening_date),
            });

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('user_settings')
                .upsert(
                    {
                        user_id: user.id,
                        opening_balance: input.opening_balance,
                        opening_date: input.opening_date,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id' }
                )
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.userSettings });
            toast.success('Opening balance updated successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to update opening balance', { description: error.message });
        },
    });
}

// ============= CATEGORY BUDGETS =============

export function useCategoryBudgets() {
    return useQuery<CategoryBudget[]>({
        queryKey: queryKeys.categoryBudgets,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('category_budgets')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;
            return data;
        },
    });
}

export function useSaveCategoryBudget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CategoryBudgetInput) => {
            const validated = categoryBudgetSchema.parse(input);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('category_budgets')
                .upsert(
                    {
                        user_id: user.id,
                        category_id: validated.category_id,
                        amount: validated.amount,
                        period: validated.period,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id,category_id,period' }
                )
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.categoryBudgets });
            toast.success('Budget saved successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to save budget', { description: error.message });
        },
    });
}

export function useDeleteCategoryBudget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('category_budgets')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.categoryBudgets });
            toast.success('Budget deleted successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to delete budget', { description: error.message });
        },
    });
}
