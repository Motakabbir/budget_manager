import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { 
    Investment, 
    Asset, 
    CreateInvestmentParams, 
    CreateAssetParams, 
    UpdateInvestmentParams, 
    UpdateAssetParams 
} from '@/lib/supabase/database.types';

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

interface Loan {
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
    created_at?: string;
    updated_at?: string;
}

interface LoanPayment {
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
    created_at?: string;
    updated_at?: string;
}

interface RecurringTransaction {
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
    created_at?: string;
    updated_at?: string;
    category?: Category;
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
    loans: Loan[];
    loanPayments: LoanPayment[];
    recurringTransactions: RecurringTransaction[];
    categoryBudgets: CategoryBudget[];
    investments: Investment[];
    assets: Asset[];
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
    setLoans: (loans: Loan[]) => void;
    setLoanPayments: (payments: LoanPayment[]) => void;
    setRecurringTransactions: (recurring: RecurringTransaction[]) => void;
    setInvestments: (investments: Investment[]) => void;
    setAssets: (assets: Asset[]) => void;
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
    fetchLoans: () => Promise<void>;
    fetchLoanPayments: () => Promise<void>;

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
    addCategoryBudget: (budget: CategoryBudget) => Promise<void>;
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

    addLoan: (loan: Omit<Loan, 'id' | 'user_id' | 'total_amount' | 'outstanding_balance'>) => Promise<void>;
    updateLoan: (id: string, updates: Partial<Loan>) => Promise<void>;
    deleteLoan: (id: string) => Promise<void>;

    makeLoanPayment: (payment: { loan_id: string; payment_amount: number; from_account_id?: string; payment_method?: string; payment_date?: string; late_fee?: number; notes?: string; receipt_number?: string }) => Promise<void>;
    receiveLoanPayment: (payment: { loan_id: string; payment_amount: number; to_account_id?: string; payment_method?: string; payment_date?: string; late_fee?: number; notes?: string; receipt_number?: string }) => Promise<void>;
    deleteLoanPayment: (id: string) => Promise<void>;

    fetchRecurringTransactions: () => Promise<void>;
    addRecurringTransaction: (recurring: Omit<RecurringTransaction, 'id' | 'user_id'>) => Promise<void>;
    updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => Promise<void>;
    deleteRecurringTransaction: (id: string) => Promise<void>;
    toggleRecurringTransaction: (id: string, isActive: boolean) => Promise<void>;
    createFromRecurring: (recurringId: string) => Promise<void>;

    fetchInvestments: () => Promise<void>;
    addInvestment: (investment: CreateInvestmentParams) => Promise<void>;
    updateInvestment: (id: string, updates: UpdateInvestmentParams) => Promise<void>;
    deleteInvestment: (id: string) => Promise<void>;

    fetchAssets: () => Promise<void>;
    addAsset: (asset: CreateAssetParams) => Promise<void>;
    updateAsset: (id: string, updates: UpdateAssetParams) => Promise<void>;
    deleteAsset: (id: string) => Promise<void>;
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
    loans: [],
    loanPayments: [],
    recurringTransactions: [],
    investments: [],
    assets: [],
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
    setLoans: (loans) => set({ loans }),
    setLoanPayments: (payments) => set({ loanPayments: payments }),
    setRecurringTransactions: (recurring) => set({ recurringTransactions: recurring }),
    setInvestments: (investments) => set({ investments }),
    setAssets: (assets) => set({ assets }),
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

    addCategoryBudget: async (budget: CategoryBudget) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('category_budgets')
            .insert({
                user_id: user.id,
                category_id: budget.category_id,
                amount: budget.amount,
                period: budget.period,
            });

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

    // ========================================
    // Loans Methods
    // ========================================

    fetchLoans: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('loans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            set({ loans: data as any });
        }
    },

    addLoan: async (loan) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('loans')
            .insert({
                user_id: user.id,
                ...loan,
            }) as any;

        if (!error) {
            await get().fetchLoans();
        }
    },

    updateLoan: async (id, updates) => {
        const { error } = await supabase
            .from('loans')
            .update({ ...updates, updated_at: new Date().toISOString() } as any)
            .eq('id', id);

        if (!error) {
            await get().fetchLoans();
        }
    },

    deleteLoan: async (id) => {
        const { error } = await supabase
            .from('loans')
            .delete()
            .eq('id', id);

        if (!error) {
            await get().fetchLoans();
        }
    },

    // ========================================
    // Loan Payments Methods
    // ========================================

    fetchLoanPayments: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('loan_payments')
            .select('*')
            .eq('user_id', user.id)
            .order('payment_date', { ascending: false });

        if (!error && data) {
            set({ loanPayments: data as any });
        }
    },

    makeLoanPayment: async (payment) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Use the PostgreSQL function for atomic payment (for loans taken)
        const { error } = await supabase.rpc('make_loan_payment', {
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

        if (!error) {
            await get().fetchLoans();
            await get().fetchLoanPayments();
            if (payment.from_account_id) {
                await get().fetchBankAccounts();
            }
        }
    },

    receiveLoanPayment: async (payment) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Use the PostgreSQL function for atomic payment (for loans given)
        const { error } = await supabase.rpc('receive_loan_payment', {
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

        if (!error) {
            await get().fetchLoans();
            await get().fetchLoanPayments();
            if (payment.to_account_id) {
                await get().fetchBankAccounts();
            }
        }
    },

    deleteLoanPayment: async (id) => {
        // Note: Deleting a payment doesn't automatically restore loan balance
        const { error } = await supabase
            .from('loan_payments')
            .delete()
            .eq('id', id);

        if (!error) {
            await get().fetchLoanPayments();
        }
    },

    // Recurring Transactions
    fetchRecurringTransactions: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('recurring_transactions')
            .select(`
                *,
                category:categories(*)
            `)
            .eq('user_id', user.id)
            .order('next_occurrence', { ascending: true });

        if (!error && data) {
            set({ recurringTransactions: data as RecurringTransaction[] });
        }
    },

    addRecurringTransaction: async (recurring) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('recurring_transactions')
            .insert({
                ...recurring,
                user_id: user.id,
            });

        if (!error) {
            await get().fetchRecurringTransactions();
        }
    },

    updateRecurringTransaction: async (id, updates) => {
        const { error } = await supabase
            .from('recurring_transactions')
            .update(updates)
            .eq('id', id);

        if (!error) {
            await get().fetchRecurringTransactions();
        }
    },

    deleteRecurringTransaction: async (id) => {
        const { error } = await supabase
            .from('recurring_transactions')
            .delete()
            .eq('id', id);

        if (!error) {
            await get().fetchRecurringTransactions();
        }
    },

    toggleRecurringTransaction: async (id, isActive) => {
        const { error } = await supabase
            .from('recurring_transactions')
            .update({ is_active: isActive })
            .eq('id', id);

        if (!error) {
            await get().fetchRecurringTransactions();
        }
    },

    createFromRecurring: async (recurringId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.rpc('create_recurring_transaction', {
            recurring_id: recurringId,
        });

        if (!error) {
            await get().fetchRecurringTransactions();
            await get().fetchTransactions();
        }
    },

    // ========================================
    // INVESTMENTS METHODS
    // ========================================

    fetchInvestments: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await (supabase as any)
            .from('investments')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            set({ investments: data as Investment[] });
        }
    },

    addInvestment: async (investment) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await (supabase as any)
            .from('investments')
            .insert({
                user_id: user.id,
                ...investment,
            });

        if (!error) {
            await get().fetchInvestments();
        }
    },

    updateInvestment: async (id, updates) => {
        const { error } = await (supabase as any)
            .from('investments')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (!error) {
            await get().fetchInvestments();
        }
    },

    deleteInvestment: async (id) => {
        const { error } = await (supabase as any)
            .from('investments')
            .delete()
            .eq('id', id);

        if (!error) {
            await get().fetchInvestments();
        }
    },

    // ========================================
    // ASSETS METHODS
    // ========================================

    fetchAssets: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await (supabase as any)
            .from('assets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            set({ assets: data as Asset[] });
        }
    },

    addAsset: async (asset) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await (supabase as any)
            .from('assets')
            .insert({
                user_id: user.id,
                ...asset,
            });

        if (!error) {
            await get().fetchAssets();
        }
    },

    updateAsset: async (id, updates) => {
        const { error } = await (supabase as any)
            .from('assets')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (!error) {
            await get().fetchAssets();
        }
    },

    deleteAsset: async (id) => {
        const { error } = await (supabase as any)
            .from('assets')
            .delete()
            .eq('id', id);

        if (!error) {
            await get().fetchAssets();
        }
    },
}));
