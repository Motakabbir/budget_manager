import { createClient, SupabaseClient as SupabaseClientBase } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Create client with explicit Database generic
// Type assertion workaround for complex type inference issues in Supabase v2
const baseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
export const supabase = baseClient as any;

// Export types for convenience  
export type SupabaseClient = SupabaseClientBase<Database>;
export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;
