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
    account_id?: string | null;
    card_id?: string | null;
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

interface BankAccount {
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
    created_at?: string;
    updated_at?: string;
}

interface AccountTransfer {
    id: string;
    user_id: string;
    from_account_id: string;
    to_account_id: string;
    amount: number;
    transfer_fee: number;
    description: string | null;
    date: string;
    created_at?: string;
    updated_at?: string;
    from_account?: BankAccount;
    to_account?: BankAccount;
}

interface PaymentCard {
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
    created_at?: string;
    updated_at?: string;
}

interface CardPayment {
    id: string;
    user_id: string;
    card_id: string;
    payment_amount: number;
    payment_date: string;
    payment_method: string | null;
    from_account_id: string | null;
    notes: string | null;
    created_at?: string;
    updated_at?: string;
}

interface BudgetStore {
    user: User | null;
    categories: Category[];
    transactions: Transaction[];
    savingsGoals: SavingsGoal[];
    userSettings: UserSettings | null;
    bankAccounts: BankAccount[];
    accountTransfers: AccountTransfer[];
    paymentCards: PaymentCard[];
    cardPayments: CardPayment[];
    categoryBudgets: CategoryBudget[];
    isLoading: boolean;

    setUser: (user: User | null) => void;
    setCategories: (categories: Category[]) => void;
    setTransactions: (transactions: Transaction[]) => void;
    setSavingsGoals: (goals: SavingsGoal[]) => void;
    setUserSettings: (settings: UserSettings | null) => void;
    setCategoryBudgets: (budgets: CategoryBudget[]) => void;
    setBankAccounts: (accounts: BankAccount[]) => void;
    setAccountTransfers: (transfers: AccountTransfer[]) => void;
    setPaymentCards: (cards: PaymentCard[]) => void;
    setCardPayments: (payments: CardPayment[]) => void;
    setLoading: (loading: boolean) => void;

    fetchCategories: () => Promise<void>;
    fetchTransactions: (startDate?: string, endDate?: string) => Promise<void>;
    fetchSavingsGoals: () => Promise<void>;
    fetchUserSettings: () => Promise<void>;
    fetchCategoryBudgets: () => Promise<void>;
    fetchBankAccounts: () => Promise<void>;
    fetchAccountTransfers: () => Promise<void>;
    fetchPaymentCards: () => Promise<void>;
    fetchCardPayments: () => Promise<void>;

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

    addBankAccount: (account: Omit<BankAccount, 'id' | 'user_id'>) => Promise<void>;
    updateBankAccount: (id: string, updates: Partial<BankAccount>) => Promise<void>;
    deleteBankAccount: (id: string) => Promise<void>;

    createAccountTransfer: (transfer: { from_account_id: string; to_account_id: string; amount: number; transfer_fee?: number; description?: string; date?: string }) => Promise<void>;
    deleteAccountTransfer: (id: string) => Promise<void>;

    addPaymentCard: (card: Omit<PaymentCard, 'id' | 'user_id' | 'available_credit'>) => Promise<void>;
    updatePaymentCard: (id: string, updates: Partial<PaymentCard>) => Promise<void>;
    deletePaymentCard: (id: string) => Promise<void>;

    makeCardPayment: (payment: { card_id: string; payment_amount: number; from_account_id?: string; payment_method?: string; payment_date?: string; notes?: string }) => Promise<void>;
    deleteCardPayment: (id: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
    user: null,
    categories: [],
    transactions: [],
    savingsGoals: [],
    userSettings: null,
    categoryBudgets: [],
    bankAccounts: [],
    accountTransfers: [],
    paymentCards: [],
    cardPayments: [],
    isLoading: false,

    setUser: (user) => set({ user }),
    setCategories: (categories) => set({ categories }),
    setTransactions: (transactions) => set({ transactions }),
    setSavingsGoals: (goals) => set({ savingsGoals: goals }),
    setUserSettings: (settings) => set({ userSettings: settings }),
    setCategoryBudgets: (budgets) => set({ categoryBudgets: budgets }),
    setBankAccounts: (accounts) => set({ bankAccounts: accounts }),
    setAccountTransfers: (transfers) => set({ accountTransfers: transfers }),
    setPaymentCards: (cards) => set({ paymentCards: cards }),
    setCardPayments: (payments) => set({ cardPayments: payments }),
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

    // ========================================
    // Bank Accounts Methods
    // ========================================

    fetchBankAccounts: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            set({ bankAccounts: data as any });
        }
    },

    addBankAccount: async (account) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('bank_accounts')
            .insert({
                user_id: user.id,
                ...account,
            }) as any;

        if (!error) {
            await get().fetchBankAccounts();
        }
    },

    updateBankAccount: async (id, updates) => {
        const { error } = await supabase
            .from('bank_accounts')
            .update({ ...updates, updated_at: new Date().toISOString() } as any)
            .eq('id', id);

        if (!error) {
            await get().fetchBankAccounts();
        }
    },

    deleteBankAccount: async (id) => {
        const { error } = await supabase
            .from('bank_accounts')
            .delete()
            .eq('id', id);

        if (!error) {
            await get().fetchBankAccounts();
        }
    },

    // ========================================
    // Account Transfers Methods
    // ========================================

    fetchAccountTransfers: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('account_transfers')
            .select(`
                *,
                from_account:bank_accounts!from_account_id(*),
                to_account:bank_accounts!to_account_id(*)
            `)
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        if (!error && data) {
            set({ accountTransfers: data as any });
        }
    },

    createAccountTransfer: async (transfer) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Use the PostgreSQL function for atomic transfer
        const { error } = await supabase.rpc('transfer_between_accounts', {
            p_user_id: user.id,
            p_from_account_id: transfer.from_account_id,
            p_to_account_id: transfer.to_account_id,
            p_amount: transfer.amount,
            p_transfer_fee: transfer.transfer_fee || 0,
            p_description: transfer.description || undefined,
            p_date: transfer.date || new Date().toISOString().split('T')[0],
        });

        if (!error) {
            await get().fetchBankAccounts();
            await get().fetchAccountTransfers();
        }
    },

    deleteAccountTransfer: async (id) => {
        // Note: Deleting a transfer doesn't automatically restore balances
        // Consider implementing a reverse transfer or balance adjustment
        const { error } = await supabase
            .from('account_transfers')
            .delete()
            .eq('id', id);

        if (!error) {
            await get().fetchAccountTransfers();
        }
    },

    // ========================================
    // Payment Cards Methods
    // ========================================

    fetchPaymentCards: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('payment_cards')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            set({ paymentCards: data as any });
        }
    },

    addPaymentCard: async (card) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('payment_cards')
            .insert({
                user_id: user.id,
                ...card,
            }) as any;

        if (!error) {
            await get().fetchPaymentCards();
        }
    },

    updatePaymentCard: async (id, updates) => {
        const { error } = await supabase
            .from('payment_cards')
            .update({ ...updates, updated_at: new Date().toISOString() } as any)
            .eq('id', id);

        if (!error) {
            await get().fetchPaymentCards();
        }
    },

    deletePaymentCard: async (id) => {
        const { error } = await supabase
            .from('payment_cards')
            .delete()
            .eq('id', id);

        if (!error) {
            await get().fetchPaymentCards();
        }
    },

    // ========================================
    // Card Payments Methods
    // ========================================

    fetchCardPayments: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('card_payments')
            .select('*')
            .eq('user_id', user.id)
            .order('payment_date', { ascending: false });

        if (!error && data) {
            set({ cardPayments: data as any });
        }
    },

    makeCardPayment: async (payment) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Use the PostgreSQL function for atomic payment
        const { error } = await supabase.rpc('make_card_payment', {
            p_user_id: user.id,
            p_card_id: payment.card_id,
            p_payment_amount: payment.payment_amount,
            p_from_account_id: payment.from_account_id || undefined,
            p_payment_method: payment.payment_method || 'bank_transfer',
            p_payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
            p_notes: payment.notes || undefined,
        });

        if (!error) {
            await get().fetchPaymentCards();
            await get().fetchCardPayments();
            if (payment.from_account_id) {
                await get().fetchBankAccounts();
            }
        }
    },

    deleteCardPayment: async (id) => {
        // Note: Deleting a payment doesn't automatically restore card balance
        const { error } = await supabase
            .from('card_payments')
            .delete()
            .eq('id', id);

        if (!error) {
            await get().fetchCardPayments();
        }
    },
}));
