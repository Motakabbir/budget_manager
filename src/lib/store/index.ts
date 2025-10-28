import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string | null;
}

interface Transaction {
    id: string;
    category_id: string;
    amount: number;
    description: string | null;
    date: string;
    type: 'income' | 'expense';
    category?: Category;
}

interface SavingsGoal {
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string | null;
}

interface User {
    id: string;
    email: string;
    full_name: string | null;
}

interface UserSettings {
    id: string;
    user_id: string;
    opening_balance: number;
    opening_date: string;
    created_at?: string;
    updated_at?: string;
}

interface CategoryBudget {
    id: string;
    user_id: string;
    category_id: string;
    amount: number;
    period: 'monthly' | 'yearly';
    created_at?: string;
    updated_at?: string;
}

interface BudgetStore {
    user: User | null;
    categories: Category[];
    transactions: Transaction[];
    savingsGoals: SavingsGoal[];
    userSettings: UserSettings | null;
    categoryBudgets: CategoryBudget[];
    isLoading: boolean;

    setUser: (user: User | null) => void;
    setCategories: (categories: Category[]) => void;
    setTransactions: (transactions: Transaction[]) => void;
    setSavingsGoals: (goals: SavingsGoal[]) => void;
    setUserSettings: (settings: UserSettings | null) => void;
    setCategoryBudgets: (budgets: CategoryBudget[]) => void;
    setLoading: (loading: boolean) => void;

    fetchCategories: () => Promise<void>;
    fetchTransactions: (startDate?: string, endDate?: string) => Promise<void>;
    fetchSavingsGoals: () => Promise<void>;
    fetchUserSettings: () => Promise<void>;
    fetchCategoryBudgets: () => Promise<void>;

    addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
    updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;

    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;

    addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'current_amount'>) => Promise<void>;
    updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
    deleteSavingsGoal: (id: string) => Promise<void>;

    saveUserSettings: (settings: { opening_balance: number; opening_date: string }) => Promise<void>;
    updateUserSettings: (updates: Partial<UserSettings>) => Promise<void>;

    saveCategoryBudget: (budget: { category_id: string; amount: number; period: 'monthly' | 'yearly' }) => Promise<void>;
    updateCategoryBudget: (id: string, updates: Partial<CategoryBudget>) => Promise<void>;
    deleteCategoryBudget: (id: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
    user: null,
    categories: [],
    transactions: [],
    savingsGoals: [],
    userSettings: null,
    categoryBudgets: [],
    isLoading: false,

    setUser: (user) => set({ user }),
    setCategories: (categories) => set({ categories }),
    setTransactions: (transactions) => set({ transactions }),
    setSavingsGoals: (goals) => set({ savingsGoals: goals }),
    setUserSettings: (settings) => set({ userSettings: settings }),
    setCategoryBudgets: (budgets) => set({ categoryBudgets: budgets }),
    setLoading: (loading) => set({ isLoading: loading }),

    fetchCategories: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id)
            .order('name');

        if (!error && data) {
            set({ categories: data });
        }
    },

    fetchTransactions: async (startDate?: string, endDate?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
            .from('transactions')
            .select(`
        *,
        category:categories(*)
      `)
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        if (startDate) {
            query = query.gte('date', startDate);
        }
        if (endDate) {
            query = query.lte('date', endDate);
        }

        const { data, error } = await query;

        if (!error && data) {
            set({ transactions: data as any });
        }
    },

    fetchSavingsGoals: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('savings_goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            set({ savingsGoals: data });
        }
    },

    fetchUserSettings: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (!error && data) {
            set({ userSettings: data });
        }
    },

    addCategory: async (category) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('categories')
            .insert({ ...category, user_id: user.id });

        if (!error) {
            await get().fetchCategories();
        }
    },

    updateCategory: async (id, updates) => {
        const { error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id);

        if (!error) {
            await get().fetchCategories();
        }
    },

    deleteCategory: async (id) => {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (!error) {
            await get().fetchCategories();
        }
    },

    addTransaction: async (transaction) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('transactions')
            .insert({ ...transaction, user_id: user.id });

        if (!error) {
            await get().fetchTransactions();
        }
    },

    updateTransaction: async (id, updates) => {
        const { error } = await supabase
            .from('transactions')
            .update(updates)
            .eq('id', id);

        if (!error) {
            await get().fetchTransactions();
        }
    },

    deleteTransaction: async (id) => {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (!error) {
            await get().fetchTransactions();
        }
    },

    addSavingsGoal: async (goal) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('savings_goals')
            .insert({ ...goal, user_id: user.id, current_amount: 0 });

        if (!error) {
            await get().fetchSavingsGoals();
        }
    },

    updateSavingsGoal: async (id, updates) => {
        const { error } = await supabase
            .from('savings_goals')
            .update(updates)
            .eq('id', id);

        if (!error) {
            await get().fetchSavingsGoals();
        }
    },

    deleteSavingsGoal: async (id) => {
        const { error } = await supabase
            .from('savings_goals')
            .delete()
            .eq('id', id);

        if (!error) {
            await get().fetchSavingsGoals();
        }
    },

    saveUserSettings: async (settings) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: user.id,
                opening_balance: settings.opening_balance,
                opening_date: settings.opening_date,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id'
            });

        if (!error) {
            await get().fetchUserSettings();
        }
    },

    updateUserSettings: async (updates) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('user_settings')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);

        if (!error) {
            await get().fetchUserSettings();
        }
    },

    fetchCategoryBudgets: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('category_budgets')
            .select('*')
            .eq('user_id', user.id);

        if (!error && data) {
            set({ categoryBudgets: data as any });
        }
    },

    saveCategoryBudget: async (budget) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('category_budgets')
            .upsert({
                user_id: user.id,
                category_id: budget.category_id,
                amount: budget.amount,
                period: budget.period,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,category_id,period'
            }) as any;

        if (!error) {
            await get().fetchCategoryBudgets();
        }
    },

    updateCategoryBudget: async (id, updates) => {
        const { error } = await supabase
            .from('category_budgets')
            .update({ ...updates, updated_at: new Date().toISOString() } as any)
            .eq('id', id);

        if (!error) {
            await get().fetchCategoryBudgets();
        }
    },

    deleteCategoryBudget: async (id) => {
        const { error } = await supabase
            .from('category_budgets')
            .delete()
            .eq('id', id);

        if (!error) {
            await get().fetchCategoryBudgets();
        }
    },
}));
