import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { transactionSchema, categorySchema, savingsGoalSchema, categoryBudgetSchema, userSettingsSchema } from '@/lib/validations/schemas';
import type { TransactionInput, CategoryInput, SavingsGoalInput, CategoryBudgetInput, UserSettingsInput } from '@/lib/validations/schemas';
import { UnusualSpendingDetector } from '@/lib/services/unusual-spending-detector';
import { notificationService } from '@/lib/services/notification.service';

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

export type Loan = {
    id: string;
    user_id: string;
    loan_type: 'given' | 'taken';
    party_name: string;
    party_contact: string | null;
    principal_amount: number;
    interest_rate: number;
    interest_type: 'simple' | 'compound' | 'none';
    total_amount: number;
    outstanding_balance: number;
    start_date: string;
    due_date: string | null;
    payment_frequency: 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'yearly';
    next_payment_date: string | null;
    status: 'active' | 'completed' | 'defaulted' | 'cancelled';
    loan_account_id: string | null;
    purpose: string | null;
    collateral: string | null;
    documents: any | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type LoanPayment = {
    id: string;
    user_id: string;
    loan_id: string;
    payment_amount: number;
    principal_paid: number;
    interest_paid: number;
    payment_date: string;
    payment_method: string | null;
    from_account_id: string | null;
    to_account_id: string | null;
    outstanding_before: number;
    outstanding_after: number;
    late_fee: number;
    notes: string | null;
    receipt_number: string | null;
    created_at: string;
    updated_at: string;
};

export type RecurringTransaction = {
    id: string;
    user_id: string;
    category_id: string;
    amount: number;
    description: string | null;
    type: 'income' | 'expense';
    frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';
    start_date: string;
    end_date: string | null;
    next_occurrence: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    category?: Category | null;
};

export type Budget = {
    id: string;
    user_id: string;
    category_id: string;
    amount: number;
    period: 'monthly' | 'yearly';
    created_at: string;
    updated_at: string;
    category?: Category | null;
};

export type BudgetWithSpending = Budget & {
    spent: number;
    remaining: number;
    percentage: number;
    status: 'safe' | 'warning' | 'exceeded';
};


// Query Keys
export const queryKeys = {
    transactions: (startDate?: string, endDate?: string) => ['transactions', startDate, endDate] as const,
    categories: ['categories'] as const,
    savingsGoals: ['savingsGoals'] as const,
    userSettings: ['userSettings'] as const,
    categoryBudgets: ['categoryBudgets'] as const,
    budgets: ['budgets'] as const,
    bankAccounts: ['bankAccounts'] as const,
    accountTransfers: ['accountTransfers'] as const,
    paymentCards: ['paymentCards'] as const,
    cardPayments: ['cardPayments'] as const,
    loans: ['loans'] as const,
    loanPayments: ['loanPayments'] as const,
    recurringTransactions: ['recurringTransactions'] as const,
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

            // Analyze for unusual spending if this is an expense transaction
            if (input.type === 'expense' && input.amount > 0) {
                try {
                    const detector = new UnusualSpendingDetector();
                    await detector.analyzeTransaction(
                        user.id,
                        input.amount,
                        input.category_id,
                        data.id
                    );
                } catch {
                    // Silently fail - spending analysis shouldn't block transaction creation
                }
            }

            return data;
        },
        onSuccess: async (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            const type = variables.type === 'income' ? 'Income' : 'Expense';
            toast.success(`${type} added successfully`, {
                description: `$${variables.amount.toFixed(2)}`,
            });

            // Smart Notification Triggers (Async - don't block UI)
            if (variables.type === 'expense') {
                try {
                    // 1. Check all budget alerts
                    await notificationService.checkAllBudgetAlerts();

                    // 2. Invalidate notifications to refresh badge count
                    queryClient.invalidateQueries({ queryKey: ['notifications'] });
                } catch (error) {
                    // Silently fail - notifications shouldn't block transaction flow
                    console.error('Failed to create notifications:', error);
                }
            }
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
        onSuccess: async (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoals });
            toast.success('Savings goal updated successfully');

            // Check for goal milestone notifications
            try {
                const goal = data as SavingsGoal;
                const percentage = (goal.current_amount / goal.target_amount) * 100;
                
                // Create milestone notification for 25%, 50%, 75%, 100%
                const milestones = [25, 50, 75, 100];
                const roundedPercentage = Math.round(percentage);
                
                if (milestones.includes(roundedPercentage)) {
                    await notificationService.goalMilestone(
                        goal.name,
                        goal.current_amount,
                        goal.target_amount,
                        roundedPercentage
                    );
                }
                
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            } catch (error) {
                console.error('Failed to create goal milestone notification:', error);
            }
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

// ============= LOANS =============

export function useLoans() {
    return useQuery<Loan[]>({
        queryKey: queryKeys.loans,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('loans')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useCreateLoan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (loan: Omit<Loan, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'total_amount' | 'outstanding_balance'>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('loans')
                .insert({
                    user_id: user.id,
                    ...loan,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.loans });
            toast.success('Loan created successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to create loan', { description: error.message });
        },
    });
}

export function useUpdateLoan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Loan> }) => {
            const { data, error } = await supabase
                .from('loans')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.loans });
            toast.success('Loan updated successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to update loan', { description: error.message });
        },
    });
}

export function useDeleteLoan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('loans')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.loans });
            queryClient.invalidateQueries({ queryKey: queryKeys.loanPayments });
            toast.success('Loan deleted successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to delete loan', { description: error.message });
        },
    });
}

// ============= LOAN PAYMENTS =============

export function useLoanPayments() {
    return useQuery<LoanPayment[]>({
        queryKey: queryKeys.loanPayments,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('loan_payments')
                .select('*')
                .eq('user_id', user.id)
                .order('payment_date', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useMakeLoanPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payment: {
            loan_id: string;
            payment_amount: number;
            from_account_id?: string;
            payment_method?: string;
            payment_date?: string;
            late_fee?: number;
            notes?: string;
            receipt_number?: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase.rpc('make_loan_payment', {
                p_user_id: user.id,
                p_loan_id: payment.loan_id,
                p_payment_amount: payment.payment_amount,
                p_from_account_id: payment.from_account_id || undefined,
                p_payment_method: payment.payment_method || 'bank_transfer',
                p_payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
                p_late_fee: payment.late_fee || 0,
                p_notes: payment.notes || undefined,
                p_receipt_number: payment.receipt_number || undefined,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.loans });
            queryClient.invalidateQueries({ queryKey: queryKeys.loanPayments });
            queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
            toast.success('Payment processed successfully');
        },
        onError: (error: Error) => {
            toast.error('Payment failed', { description: error.message });
        },
    });
}

export function useReceiveLoanPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payment: {
            loan_id: string;
            payment_amount: number;
            to_account_id?: string;
            payment_method?: string;
            payment_date?: string;
            late_fee?: number;
            notes?: string;
            receipt_number?: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase.rpc('receive_loan_payment', {
                p_user_id: user.id,
                p_loan_id: payment.loan_id,
                p_payment_amount: payment.payment_amount,
                p_to_account_id: payment.to_account_id || undefined,
                p_payment_method: payment.payment_method || 'bank_transfer',
                p_payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
                p_late_fee: payment.late_fee || 0,
                p_notes: payment.notes || undefined,
                p_receipt_number: payment.receipt_number || undefined,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.loans });
            queryClient.invalidateQueries({ queryKey: queryKeys.loanPayments });
            queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
            toast.success('Payment received successfully');
        },
        onError: (error: Error) => {
            toast.error('Payment failed', { description: error.message });
        },
    });
}

export function useDeleteLoanPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('loan_payments')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.loanPayments });
            toast.success('Payment record deleted successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to delete payment', { description: error.message });
        },
    });
}

// ============= RECURRING TRANSACTIONS =============

export function useRecurringTransactions() {
    return useQuery<RecurringTransaction[]>({
        queryKey: queryKeys.recurringTransactions,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('recurring_transactions')
                .select(`
                    *,
                    category:categories(*)
                `)
                .eq('user_id', user.id)
                .order('next_occurrence', { ascending: true });

            if (error) throw error;
            return data as RecurringTransaction[];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useCreateRecurring() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (recurring: {
            category_id: string;
            amount: number;
            description?: string;
            type: 'income' | 'expense';
            frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';
            start_date: string;
            end_date?: string;
            next_occurrence: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('recurring_transactions')
                .insert({
                    ...recurring,
                    user_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.recurringTransactions });
            toast.success('Recurring transaction created successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to create recurring transaction', { description: error.message });
        },
    });
}

export function useUpdateRecurring() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<RecurringTransaction> }) => {
            const { data, error } = await supabase
                .from('recurring_transactions')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.recurringTransactions });
            toast.success('Recurring transaction updated successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to update recurring transaction', { description: error.message });
        },
    });
}

export function useDeleteRecurring() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('recurring_transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.recurringTransactions });
            toast.success('Recurring transaction deleted successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to delete recurring transaction', { description: error.message });
        },
    });
}

export function useToggleRecurring() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            const { data, error } = await supabase
                .from('recurring_transactions')
                .update({ is_active: isActive })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.recurringTransactions });
            toast.success(variables.isActive ? 'Recurring transaction activated' : 'Recurring transaction deactivated');
        },
        onError: (error: Error) => {
            toast.error('Failed to toggle recurring transaction', { description: error.message });
        },
    });
}

export function useCreateFromRecurring() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (recurringId: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase.rpc('create_recurring_transaction', {
                recurring_id: recurringId,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.recurringTransactions });
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
            toast.success('Transaction created from recurring template');
        },
        onError: (error: Error) => {
            toast.error('Failed to create transaction', { description: error.message });
        },
    });
}

// ============= BUDGETS =============

export function useBudgets() {
    return useQuery<Budget[]>({
        queryKey: queryKeys.budgets,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('category_budgets')
                .select('*, category:categories(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Budget[];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useCreateBudget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: { category_id: string; amount: number; period: 'monthly' | 'yearly' }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('category_budgets')
                .insert({
                    user_id: user.id,
                    category_id: params.category_id,
                    amount: params.amount,
                    period: params.period,
                })
                .select('*, category:categories(*)')
                .single();

            if (error) throw error;
            return data as Budget;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
            queryClient.invalidateQueries({ queryKey: queryKeys.categoryBudgets });
            toast.success('Budget created successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to create budget', { description: error.message });
        },
    });
}

export function useUpdateBudget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: { amount?: number; period?: 'monthly' | 'yearly' } }) => {
            const { data, error } = await supabase
                .from('category_budgets')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select('*, category:categories(*)')
                .single();

            if (error) throw error;
            return data as Budget;
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
            queryClient.invalidateQueries({ queryKey: queryKeys.categoryBudgets });
            toast.success('Budget updated successfully');

            // Check budget alerts after update
            try {
                await notificationService.checkAllBudgetAlerts();
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            } catch (error) {
                console.error('Failed to check budget alerts:', error);
            }
        },
        onError: (error: Error) => {
            toast.error('Failed to update budget', { description: error.message });
        },
    });
}

export function useDeleteBudget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('category_budgets')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
            queryClient.invalidateQueries({ queryKey: queryKeys.categoryBudgets });
            toast.success('Budget deleted successfully');
        },
        onError: (error: Error) => {
            toast.error('Failed to delete budget', { description: error.message });
        },
    });
}

export function useBudgetSpending(categoryId: string, period: 'monthly' | 'yearly') {
    return useQuery<{ spent: number; budget: Budget | null }>({
        queryKey: ['budgetSpending', categoryId, period],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Get the budget
            const { data: budget, error: budgetError } = await supabase
                .from('category_budgets')
                .select('*, category:categories(*)')
                .eq('user_id', user.id)
                .eq('category_id', categoryId)
                .eq('period', period)
                .single();

            if (budgetError && budgetError.code !== 'PGRST116') throw budgetError;

            // Calculate date range based on period
            const now = new Date();
            let startDate: string;
            let endDate: string;

            if (period === 'monthly') {
                // Current month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            } else {
                // Current year
                startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
            }

            // Get total spending for this category in the period
            const { data: transactions, error: transError } = await supabase
                .from('transactions')
                .select('amount')
                .eq('user_id', user.id)
                .eq('category_id', categoryId)
                .eq('type', 'expense')
                .gte('date', startDate)
                .lte('date', endDate);

            if (transError) throw transError;

            const spent = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

            return {
                spent,
                budget: budget as Budget | null,
            };
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
        enabled: !!categoryId,
    });
}

export function useBudgetsWithSpending() {
    const { data: budgets } = useBudgets();
    const { data: transactions } = useTransactions();

    return useQuery<BudgetWithSpending[]>({
        queryKey: ['budgetsWithSpending', budgets, transactions],
        queryFn: async () => {
            if (!budgets || !transactions) return [];

            const now = new Date();

            return budgets.map((budget) => {
                // Calculate date range based on period
                let startDate: Date;
                let endDate: Date;

                if (budget.period === 'monthly') {
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                } else {
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31);
                }

                // Calculate spending for this category in the period
                const spent = transactions
                    .filter((t) => {
                        const transDate = new Date(t.date);
                        return (
                            t.category_id === budget.category_id &&
                            t.type === 'expense' &&
                            transDate >= startDate &&
                            transDate <= endDate
                        );
                    })
                    .reduce((sum, t) => sum + t.amount, 0);

                const remaining = Math.max(0, budget.amount - spent);
                const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

                let status: 'safe' | 'warning' | 'exceeded';
                if (percentage >= 100) {
                    status = 'exceeded';
                } else if (percentage >= 80) {
                    status = 'warning';
                } else {
                    status = 'safe';
                }

                return {
                    ...budget,
                    spent,
                    remaining,
                    percentage,
                    status,
                };
            });
        },
        enabled: !!budgets && !!transactions,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}
