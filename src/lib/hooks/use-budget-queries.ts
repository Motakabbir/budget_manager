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

export type BankAccount = {
    id: string;
    user_id: string;
    account_name: string;
    bank_name: string | null;
    account_type: 'checking' | 'savings' | 'investment' | 'cash' | 'wallet' | 'other';
    account_number: string | null;
    balance: number;
    currency: string;
    color: string;
    icon: string | null;
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type AccountTransfer = {
    id: string;
    user_id: string;
    from_account_id: string;
    to_account_id: string;
    amount: number;
    transfer_fee: number;
    description: string | null;
    date: string;
    created_at: string;
    updated_at: string;
    from_account?: BankAccount;
    to_account?: BankAccount;
};

export type PaymentCard = {
    id: string;
    user_id: string;
    card_name: string;
    card_type: 'debit' | 'credit';
    card_network: string | null;
    last_four_digits: string | null;
    bank_account_id: string | null;
    credit_limit: number | null;
    current_balance: number;
    available_credit: number | null;
    interest_rate: number | null;
    billing_cycle_day: number | null;
    payment_due_day: number | null;
    minimum_payment_percent: number | null;
    expiry_date: string | null;
    cardholder_name: string | null;
    color: string;
    icon: string | null;
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type CardPayment = {
    id: string;
    user_id: string;
    card_id: string;
    payment_amount: number;
    payment_date: string;
    payment_method: string | null;
    from_account_id: string | null;
    notes: string | null;
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
    bankAccounts: ['bankAccounts'] as const,
    accountTransfers: ['accountTransfers'] as const,
    paymentCards: ['paymentCards'] as const,
    cardPayments: ['cardPayments'] as const,
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

// ============= BANK ACCOUNTS =============

export function useBankAccounts() {
    return useQuery<BankAccount[]>({
        queryKey: queryKeys.bankAccounts,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('bank_accounts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useCreateBankAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (account: Omit<BankAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('bank_accounts')
                .insert({
                    user_id: user.id,
                    ...account,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
            toast.success('Bank account created successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to create bank account', { description: error.message });
        },
    });
}

export function useUpdateBankAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<BankAccount> }) => {
            const { data, error } = await supabase
                .from('bank_accounts')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
            toast.success('Bank account updated successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to update bank account', { description: error.message });
        },
    });
}

export function useDeleteBankAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('bank_accounts')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
            toast.success('Bank account deleted successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to delete bank account', { description: error.message });
        },
    });
}

// ============= ACCOUNT TRANSFERS =============

export function useAccountTransfers() {
    return useQuery<AccountTransfer[]>({
        queryKey: queryKeys.accountTransfers,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('account_transfers')
                .select(`
                    *,
                    from_account:bank_accounts!from_account_id(*),
                    to_account:bank_accounts!to_account_id(*)
                `)
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useCreateAccountTransfer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (transfer: {
            from_account_id: string;
            to_account_id: string;
            amount: number;
            transfer_fee?: number;
            description?: string;
            date?: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase.rpc('transfer_between_accounts', {
                p_user_id: user.id,
                p_from_account_id: transfer.from_account_id,
                p_to_account_id: transfer.to_account_id,
                p_amount: transfer.amount,
                p_transfer_fee: transfer.transfer_fee || 0,
                p_description: transfer.description || undefined,
                p_date: transfer.date || new Date().toISOString().split('T')[0],
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
            queryClient.invalidateQueries({ queryKey: queryKeys.accountTransfers });
            toast.success('Transfer completed successfully');
        },
        onError: (error: Error) => {
            toast.error('Transfer failed', { description: error.message });
        },
    });
}

export function useDeleteAccountTransfer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('account_transfers')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.accountTransfers });
            toast.success('Transfer deleted successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to delete transfer', { description: error.message });
        },
    });
}

// ============= PAYMENT CARDS =============

export function usePaymentCards() {
    return useQuery<PaymentCard[]>({
        queryKey: queryKeys.paymentCards,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('payment_cards')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useCreatePaymentCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (card: Omit<PaymentCard, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'available_credit'>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('payment_cards')
                .insert({
                    user_id: user.id,
                    ...card,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.paymentCards });
            toast.success('Card added successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to add card', { description: error.message });
        },
    });
}

export function useUpdatePaymentCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<PaymentCard> }) => {
            const { data, error } = await supabase
                .from('payment_cards')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.paymentCards });
            toast.success('Card updated successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to update card', { description: error.message });
        },
    });
}

export function useDeletePaymentCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('payment_cards')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.paymentCards });
            toast.success('Card deleted successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to delete card', { description: error.message });
        },
    });
}

// ============= CARD PAYMENTS =============

export function useCardPayments() {
    return useQuery<CardPayment[]>({
        queryKey: queryKeys.cardPayments,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('card_payments')
                .select('*')
                .eq('user_id', user.id)
                .order('payment_date', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useMakeCardPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payment: {
            card_id: string;
            payment_amount: number;
            from_account_id?: string;
            payment_method?: string;
            payment_date?: string;
            notes?: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase.rpc('make_card_payment', {
                p_user_id: user.id,
                p_card_id: payment.card_id,
                p_payment_amount: payment.payment_amount,
                p_from_account_id: payment.from_account_id || undefined,
                p_payment_method: payment.payment_method || 'bank_transfer',
                p_payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
                p_notes: payment.notes || undefined,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.paymentCards });
            queryClient.invalidateQueries({ queryKey: queryKeys.cardPayments });
            queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
            toast.success('Payment processed successfully');
        },
        onError: (error: Error) => {
            toast.error('Payment failed', { description: error.message });
        },
    });
}

export function useDeleteCardPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('card_payments')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cardPayments });
            toast.success('Payment record deleted successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to delete payment', { description: error.message });
        },
    });
}
