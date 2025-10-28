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

interface BudgetStore {
    user: User | null;
    categories: Category[];
    transactions: Transaction[];
    savingsGoals: SavingsGoal[];
    isLoading: boolean;

    setUser: (user: User | null) => void;
    setCategories: (categories: Category[]) => void;
    setTransactions: (transactions: Transaction[]) => void;
    setSavingsGoals: (goals: SavingsGoal[]) => void;
    setLoading: (loading: boolean) => void;

    fetchCategories: () => Promise<void>;
    fetchTransactions: (startDate?: string, endDate?: string) => Promise<void>;
    fetchSavingsGoals: () => Promise<void>;

    addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
    updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;

    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;

    addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'current_amount'>) => Promise<void>;
    updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
    deleteSavingsGoal: (id: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
    user: null,
    categories: [],
    transactions: [],
    savingsGoals: [],
    isLoading: false,

    setUser: (user) => set({ user }),
    setCategories: (categories) => set({ categories }),
    setTransactions: (transactions) => set({ transactions }),
    setSavingsGoals: (goals) => set({ savingsGoals: goals }),
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
}));
