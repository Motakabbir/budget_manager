export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
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
            }
        }
    }
}
