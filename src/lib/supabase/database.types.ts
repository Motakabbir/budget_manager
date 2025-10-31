export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            categories: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    type: 'income' | 'expense'
                    color: string
                    icon: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    type: 'income' | 'expense'
                    color: string
                    icon?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    type?: 'income' | 'expense'
                    color?: string
                    icon?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            transactions: {
                Row: {
                    id: string
                    user_id: string
                    category_id: string
                    amount: number
                    description: string | null
                    date: string
                    type: 'income' | 'expense'
                    account_id: string | null
                    card_id: string | null
                    payment_method: string | null
                    loan_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    category_id: string
                    amount: number
                    description?: string | null
                    date: string
                    type: 'income' | 'expense'
                    account_id?: string | null
                    card_id?: string | null
                    payment_method?: string | null
                    loan_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    category_id?: string
                    amount?: number
                    description?: string | null
                    date?: string
                    type?: 'income' | 'expense'
                    account_id?: string | null
                    card_id?: string | null
                    payment_method?: string | null
                    loan_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "transactions_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    }
                ]
            }
            savings_goals: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    target_amount: number
                    current_amount: number
                    deadline: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    target_amount: number
                    current_amount?: number
                    deadline?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    target_amount?: number
                    current_amount?: number
                    deadline?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            user_settings: {
                Row: {
                    id: string
                    user_id: string
                    opening_balance: number
                    opening_date: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    opening_balance?: number
                    opening_date?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    opening_balance?: number
                    opening_date?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            category_budgets: {
                Row: {
                    id: string
                    user_id: string
                    category_id: string
                    amount: number
                    period: 'monthly' | 'yearly'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    category_id: string
                    amount: number
                    period?: 'monthly' | 'yearly'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    category_id?: string
                    amount?: number
                    period?: 'monthly' | 'yearly'
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "category_budgets_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    }
                ]
            }
            recurring_transactions: {
                Row: {
                    id: string
                    user_id: string
                    category_id: string
                    amount: number
                    description: string | null
                    type: 'income' | 'expense'
                    frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly'
                    start_date: string
                    end_date: string | null
                    next_occurrence: string
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    category_id: string
                    amount: number
                    description?: string | null
                    type: 'income' | 'expense'
                    frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly'
                    start_date?: string
                    end_date?: string | null
                    next_occurrence: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    category_id?: string
                    amount?: number
                    description?: string | null
                    type?: 'income' | 'expense'
                    frequency?: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly'
                    start_date?: string
                    end_date?: string | null
                    next_occurrence?: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "recurring_transactions_category_id_fkey"
                        columns: ["category_id"]
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "recurring_transactions_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    type: string
                    title: string
                    message: string
                    icon: string | null
                    priority: string
                    is_read: boolean
                    action_url: string | null
                    metadata: Json | null
                    created_at: string
                    read_at: string | null
                    expires_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: string
                    title: string
                    message: string
                    icon?: string | null
                    priority?: string
                    is_read?: boolean
                    action_url?: string | null
                    metadata?: Json | null
                    created_at?: string
                    read_at?: string | null
                    expires_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: string
                    title?: string
                    message?: string
                    icon?: string | null
                    priority?: string
                    is_read?: boolean
                    action_url?: string | null
                    metadata?: Json | null
                    created_at?: string
                    read_at?: string | null
                    expires_at?: string | null
                }
                Relationships: []
            }
            notification_preferences: {
                Row: {
                    id: string
                    user_id: string
                    budget_alerts: boolean
                    goal_milestones: boolean
                    spending_insights: boolean
                    daily_tips: boolean
                    weekly_summary: boolean
                    email_notifications: boolean
                    push_notifications: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    budget_alerts?: boolean
                    goal_milestones?: boolean
                    spending_insights?: boolean
                    daily_tips?: boolean
                    weekly_summary?: boolean
                    email_notifications?: boolean
                    push_notifications?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    budget_alerts?: boolean
                    goal_milestones?: boolean
                    spending_insights?: boolean
                    daily_tips?: boolean
                    weekly_summary?: boolean
                    email_notifications?: boolean
                    push_notifications?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            bank_accounts: {
                Row: {
                    id: string
                    user_id: string
                    account_name: string
                    bank_name: string | null
                    account_type: 'checking' | 'savings' | 'investment' | 'cash' | 'wallet' | 'other'
                    account_number: string | null
                    balance: number
                    currency: string
                    color: string
                    icon: string | null
                    is_active: boolean
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    account_name: string
                    bank_name?: string | null
                    account_type: 'checking' | 'savings' | 'investment' | 'cash' | 'wallet' | 'other'
                    account_number?: string | null
                    balance?: number
                    currency?: string
                    color?: string
                    icon?: string | null
                    is_active?: boolean
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    account_name?: string
                    bank_name?: string | null
                    account_type?: 'checking' | 'savings' | 'investment' | 'cash' | 'wallet' | 'other'
                    account_number?: string | null
                    balance?: number
                    currency?: string
                    color?: string
                    icon?: string | null
                    is_active?: boolean
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            account_transfers: {
                Row: {
                    id: string
                    user_id: string
                    from_account_id: string
                    to_account_id: string
                    amount: number
                    transfer_fee: number
                    description: string | null
                    date: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    from_account_id: string
                    to_account_id: string
                    amount: number
                    transfer_fee?: number
                    description?: string | null
                    date?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    from_account_id?: string
                    to_account_id?: string
                    amount?: number
                    transfer_fee?: number
                    description?: string | null
                    date?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "account_transfers_from_account_id_fkey"
                        columns: ["from_account_id"]
                        referencedRelation: "bank_accounts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "account_transfers_to_account_id_fkey"
                        columns: ["to_account_id"]
                        referencedRelation: "bank_accounts"
                        referencedColumns: ["id"]
                    }
                ]
            }
            payment_cards: {
                Row: {
                    id: string
                    user_id: string
                    card_name: string
                    card_type: 'debit' | 'credit'
                    card_network: string | null
                    last_four_digits: string | null
                    bank_account_id: string | null
                    credit_limit: number | null
                    current_balance: number
                    available_credit: number | null
                    interest_rate: number | null
                    billing_cycle_day: number | null
                    payment_due_day: number | null
                    minimum_payment_percent: number | null
                    expiry_date: string | null
                    cardholder_name: string | null
                    color: string
                    icon: string | null
                    is_active: boolean
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    card_name: string
                    card_type: 'debit' | 'credit'
                    card_network?: string | null
                    last_four_digits?: string | null
                    bank_account_id?: string | null
                    credit_limit?: number | null
                    current_balance?: number
                    available_credit?: number | null
                    interest_rate?: number | null
                    billing_cycle_day?: number | null
                    payment_due_day?: number | null
                    minimum_payment_percent?: number | null
                    expiry_date?: string | null
                    cardholder_name?: string | null
                    color?: string
                    icon?: string | null
                    is_active?: boolean
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    card_name?: string
                    card_type?: 'debit' | 'credit'
                    card_network?: string | null
                    last_four_digits?: string | null
                    bank_account_id?: string | null
                    credit_limit?: number | null
                    current_balance?: number
                    available_credit?: number | null
                    interest_rate?: number | null
                    billing_cycle_day?: number | null
                    payment_due_day?: number | null
                    minimum_payment_percent?: number | null
                    expiry_date?: string | null
                    cardholder_name?: string | null
                    color?: string
                    icon?: string | null
                    is_active?: boolean
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "payment_cards_bank_account_id_fkey"
                        columns: ["bank_account_id"]
                        referencedRelation: "bank_accounts"
                        referencedColumns: ["id"]
                    }
                ]
            }
            card_payments: {
                Row: {
                    id: string
                    user_id: string
                    card_id: string
                    payment_amount: number
                    payment_date: string
                    payment_method: string | null
                    from_account_id: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    card_id: string
                    payment_amount: number
                    payment_date?: string
                    payment_method?: string | null
                    from_account_id?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    card_id?: string
                    payment_amount?: number
                    payment_date?: string
                    payment_method?: string | null
                    from_account_id?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "card_payments_card_id_fkey"
                        columns: ["card_id"]
                        referencedRelation: "payment_cards"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "card_payments_from_account_id_fkey"
                        columns: ["from_account_id"]
                        referencedRelation: "bank_accounts"
                        referencedColumns: ["id"]
                    }
                ]
            }
            loans: {
                Row: {
                    id: string
                    user_id: string
                    loan_type: 'given' | 'taken'
                    party_name: string
                    party_contact: string | null
                    principal_amount: number
                    interest_rate: number
                    interest_type: 'simple' | 'compound' | 'none'
                    total_amount: number
                    outstanding_balance: number
                    start_date: string
                    due_date: string | null
                    payment_frequency: 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'yearly'
                    next_payment_date: string | null
                    status: 'active' | 'completed' | 'defaulted' | 'cancelled'
                    loan_account_id: string | null
                    purpose: string | null
                    collateral: string | null
                    documents: Json | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    loan_type: 'given' | 'taken'
                    party_name: string
                    party_contact?: string | null
                    principal_amount: number
                    interest_rate?: number
                    interest_type?: 'simple' | 'compound' | 'none'
                    total_amount?: number
                    outstanding_balance?: number
                    start_date: string
                    due_date?: string | null
                    payment_frequency?: 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'yearly'
                    next_payment_date?: string | null
                    status?: 'active' | 'completed' | 'defaulted' | 'cancelled'
                    loan_account_id?: string | null
                    purpose?: string | null
                    collateral?: string | null
                    documents?: Json | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    loan_type?: 'given' | 'taken'
                    party_name?: string
                    party_contact?: string | null
                    principal_amount?: number
                    interest_rate?: number
                    interest_type?: 'simple' | 'compound' | 'none'
                    total_amount?: number
                    outstanding_balance?: number
                    start_date?: string
                    due_date?: string | null
                    payment_frequency?: 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'yearly'
                    next_payment_date?: string | null
                    status?: 'active' | 'completed' | 'defaulted' | 'cancelled'
                    loan_account_id?: string | null
                    purpose?: string | null
                    collateral?: string | null
                    documents?: Json | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "loans_loan_account_id_fkey"
                        columns: ["loan_account_id"]
                        referencedRelation: "bank_accounts"
                        referencedColumns: ["id"]
                    }
                ]
            }
            loan_payments: {
                Row: {
                    id: string
                    user_id: string
                    loan_id: string
                    payment_amount: number
                    principal_paid: number
                    interest_paid: number
                    payment_date: string
                    payment_method: string | null
                    from_account_id: string | null
                    to_account_id: string | null
                    outstanding_before: number
                    outstanding_after: number
                    late_fee: number
                    notes: string | null
                    receipt_number: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    loan_id: string
                    payment_amount: number
                    principal_paid?: number
                    interest_paid?: number
                    payment_date?: string
                    payment_method?: string | null
                    from_account_id?: string | null
                    to_account_id?: string | null
                    outstanding_before?: number
                    outstanding_after?: number
                    late_fee?: number
                    notes?: string | null
                    receipt_number?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    loan_id?: string
                    payment_amount?: number
                    principal_paid?: number
                    interest_paid?: number
                    payment_date?: string
                    payment_method?: string | null
                    from_account_id?: string | null
                    to_account_id?: string | null
                    outstanding_before?: number
                    outstanding_after?: number
                    late_fee?: number
                    notes?: string | null
                    receipt_number?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "loan_payments_loan_id_fkey"
                        columns: ["loan_id"]
                        referencedRelation: "loans"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "loan_payments_from_account_id_fkey"
                        columns: ["from_account_id"]
                        referencedRelation: "bank_accounts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "loan_payments_to_account_id_fkey"
                        columns: ["to_account_id"]
                        referencedRelation: "bank_accounts"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            transfer_between_accounts: {
                Args: {
                    p_user_id: string
                    p_from_account_id: string
                    p_to_account_id: string
                    p_amount: number
                    p_transfer_fee?: number
                    p_description?: string
                    p_date?: string
                }
                Returns: string
            }
            make_card_payment: {
                Args: {
                    p_user_id: string
                    p_card_id: string
                    p_payment_amount: number
                    p_from_account_id?: string
                    p_payment_method?: string
                    p_payment_date?: string
                    p_notes?: string
                }
                Returns: string
            }
            charge_credit_card: {
                Args: {
                    p_user_id: string
                    p_card_id: string
                    p_charge_amount: number
                }
                Returns: boolean
            }
            make_loan_payment: {
                Args: {
                    p_user_id: string
                    p_loan_id: string
                    p_payment_amount: number
                    p_from_account_id?: string
                    p_payment_method?: string
                    p_payment_date?: string
                    p_late_fee?: number
                    p_notes?: string
                    p_receipt_number?: string
                }
                Returns: string
            }
            receive_loan_payment: {
                Args: {
                    p_user_id: string
                    p_loan_id: string
                    p_payment_amount: number
                    p_to_account_id?: string
                    p_payment_method?: string
                    p_payment_date?: string
                    p_late_fee?: number
                    p_notes?: string
                    p_receipt_number?: string
                }
                Returns: string
            }
            create_recurring_transaction: {
                Args: {
                    recurring_id: string
                }
                Returns: string
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// ============================================================================
// Enhanced Budget Types with Spending Tracking
// ============================================================================

export type BudgetPeriod = 'monthly' | 'yearly';

export interface Budget {
    id: string;
    user_id: string;
    category_id: string;
    amount: number;
    period: BudgetPeriod;
    created_at: string;
    updated_at: string;
    categories?: {
        id: string;
        name: string;
        type: 'income' | 'expense';
        color: string;
        icon?: string | null;
    };
}

export interface BudgetWithSpending extends Budget {
    spent: number;
    remaining: number;
    percentage: number;
    status: 'safe' | 'warning' | 'exceeded';
}

export interface CreateBudgetParams {
    category_id: string;
    amount: number;
    period: BudgetPeriod;
}

export interface UpdateBudgetParams {
    amount?: number;
    period?: BudgetPeriod;
}
