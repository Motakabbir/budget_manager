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
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
