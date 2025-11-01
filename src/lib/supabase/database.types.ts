// ============================================
// Database Type Definitions
// Auto-generated types for Supabase tables
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// Enums
// ============================================

export type AssetType = 
  | 'property'
  | 'vehicle'
  | 'jewelry'
  | 'electronics'
  | 'furniture'
  | 'collectibles'
  | 'equipment'
  | 'other';

export type AssetCondition = 
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor';

export type PropertyType = 
  | 'residential'
  | 'commercial'
  | 'land'
  | 'house'
  | 'apartment'
  | 'other';

export type InvestmentType = 
  | 'stock'
  | 'bond'
  | 'mutual_fund'
  | 'etf'
  | 'crypto'
  | 'fixed_deposit'
  | 'gold'
  | 'reit'
  | 'commodities'
  | 'real_estate'
  | 'other';

export type InvestmentStatus = 
  | 'active'
  | 'sold'
  | 'closed';

export type TransactionType = 
  | 'income'
  | 'expense';

export type RecurrenceInterval = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly';

// ============================================
// Table Row Types
// ============================================

export interface Asset {
  id: string;
  user_id: string;
  asset_type: AssetType;
  name: string;
  brand: string | null;
  model: string | null;
  purchase_price: number;
  purchase_date: string;
  current_value: number;
  depreciation_rate: number | null;
  salvage_value: number | null;
  useful_life_years: number | null;
  is_insured: boolean;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  insurance_expiry_date: string | null;
  insurance_premium: number | null;
  serial_number: string | null;
  purchase_location: string | null;
  warranty_expiry_date: string | null;
  property_address: string | null;
  property_size_sqft: number | null;
  property_type: PropertyType | null;
  vehicle_make: string | null;
  vehicle_year: number | null;
  vehicle_vin: string | null;
  vehicle_mileage: number | null;
  vehicle_license_plate: string | null;
  condition: AssetCondition | null;
  location: string | null;
  notes: string | null;
  is_active: boolean;
  sale_date: string | null;
  sale_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  investment_type: InvestmentType;
  name: string;
  symbol: string | null;
  quantity: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string;
  currency: string;
  platform: string | null;
  dividend_yield: number | null;
  last_dividend_date: string | null;
  total_dividends_received: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  payment_method: string | null;
  recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  account_name: string;
  account_type: string;
  account_number: string | null;
  bank_name: string;
  balance: number;
  currency: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentCard {
  id: string;
  user_id: string;
  card_name: string;
  card_type: string;
  last_four_digits: string;
  bank_name: string;
  credit_limit: number | null;
  current_balance: number;
  billing_date: number | null;
  payment_due_date: number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number;
  period: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  loan_name: string;
  loan_type: string;
  principal_amount: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  end_date: string;
  monthly_payment: number;
  remaining_balance: number;
  lender: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  category: string | null;
  description: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  is_read: boolean;
  action_url: string | null;
  metadata: Json | null;
  created_at: string;
  expires_at: string | null;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email?: string; // From auth.users, not stored in profile table
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  date_of_birth: string | null;
  location: string | null;
  currency: string;
  language: string;
  timezone: string;
  theme_preference: 'light' | 'dark' | 'system';
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Extended Types with Calculations
// ============================================

export interface AssetWithStats extends Asset {
  total_depreciation?: number;
  depreciation_percentage?: number;
  age_years?: number;
  age_months?: number;
  avg_annual_depreciation?: number;
  sale_profit_loss?: number | null;
  insurance_status?: 'valid' | 'expiring_soon' | 'expired' | 'not_insured';
  warranty_status?: 'valid' | 'expiring_soon' | 'expired' | 'no_warranty';
}

export interface InvestmentWithStats extends Investment {
  total_value?: number;
  current_value?: number;
  total_gain_loss?: number;
  profit_loss?: number;
  gain_loss_percentage?: number;
  profit_loss_percentage?: number;
  return_on_investment?: number;
  roi_percentage?: number;
  days_held?: number;
}

export interface BudgetWithSpent extends Budget {
  spent?: number;
  remaining?: number;
  percentage_used?: number;
}

export interface LoanWithPayments extends Loan {
  total_paid?: number;
  total_interest?: number;
  payments_made?: number;
  payments_remaining?: number;
}

// ============================================
// Parameter Types for Mutations
// ============================================

export type CreateAssetParams = Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateAssetParams = Partial<CreateAssetParams>;

export type CreateInvestmentParams = Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateInvestmentParams = Partial<CreateInvestmentParams>;

// ============================================
// Summary and Analytics Types
// ============================================

export interface AssetsSummary {
  total_assets: number;
  active_assets: number;
  total_purchase_value: number;
  total_purchase_price: number;
  total_current_value: number;
  total_depreciation: number;
  depreciation_percentage: number;
  total_insured_value: number;
  assets_insured_count: number;
}

export interface AssetBreakdown {
  asset_type: AssetType;
  count: number;
  total_purchase_price: number;
  total_current_value: number;
  total_depreciation: number;
  percentage_of_total: number;
}

export interface AssetDepreciation {
  asset_id: string;
  asset_name: string;
  purchase_date: string;
  age_years: number;
  purchase_price: number;
  current_value: number;
  depreciation_amount: number;
  depreciation_percentage: number;
  avg_annual_depreciation: number;
}

export interface ExpiringCoverage {
  asset_id: string;
  asset_name: string;
  coverage_type: 'insurance' | 'warranty';
  expiry_date: string;
  days_until_expiry: number;
  provider?: string;
  policy_number?: string;
}

export interface InvestmentsSummary {
  total_investments: number;
  total_invested: number;
  total_current_value: number;
  total_gain_loss: number;
  overall_return_percentage: number;
  active_investments: number;
}

export interface PortfolioSummary {
  total_investments: number;
  total_invested: number;
  total_current_value: number;
  total_gain_loss: number;
  total_profit_loss: number;
  overall_return_percentage: number;
  total_profit_loss_percentage: number;
  total_dividends: number;
  active_investments: number;
}

export interface InvestmentBreakdown {
  investment_type: InvestmentType;
  count: number;
  total_invested: number;
  total_current_value: number;
  total_gain_loss: number;
  percentage_of_portfolio: number;
}

// ============================================
// Additional Table Types
// ============================================

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryBudget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: 'monthly' | 'yearly';
  categories?: Category;
  created_at: string;
  updated_at: string;
}

export interface OpeningBalance {
  id: string;
  user_id: string;
  opening_balance: number;
  opening_date: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category_id: string;
  category?: Category;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string | null;
  next_occurrence: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SecuritySettings {
  id: string;
  user_id: string;
  pin_enabled: boolean;
  pin_hash: string | null;
  pin_salt: string | null;
  pin_attempts: number;
  pin_locked_until: string | null;
  biometric_enabled: boolean;
  biometric_credential_id: string | null;
  biometric_type: string | null;
  auto_logout_enabled: boolean;
  auto_logout_minutes: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  tour_completed: boolean;
  tours_viewed: string[] | null;
  tour_version: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Database Schema Type
// ============================================

export interface Database {
  public: {
    Tables: {
      assets: {
        Row: Asset;
        Insert: Omit<Asset, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Asset, 'id' | 'user_id' | 'created_at'>>;
      };
      investments: {
        Row: Investment;
        Insert: Omit<Investment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Investment, 'id' | 'user_id' | 'created_at'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>;
      };
      bank_accounts: {
        Row: BankAccount;
        Insert: Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BankAccount, 'id' | 'user_id' | 'created_at'>>;
      };
      payment_cards: {
        Row: PaymentCard;
        Insert: Omit<PaymentCard, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PaymentCard, 'id' | 'user_id' | 'created_at'>>;
      };
      budgets: {
        Row: Budget;
        Insert: Omit<Budget, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Budget, 'id' | 'user_id' | 'created_at'>>;
      };
      loans: {
        Row: Loan;
        Insert: Omit<Loan, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Loan, 'id' | 'user_id' | 'created_at'>>;
      };
      goals: {
        Row: Goal;
        Insert: Omit<Goal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'user_id' | 'created_at'>>;
      };
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>>;
      };
      savings_goals: {
        Row: SavingsGoal;
        Insert: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SavingsGoal, 'id' | 'user_id' | 'created_at'>>;
      };
      category_budgets: {
        Row: CategoryBudget;
        Insert: Omit<CategoryBudget, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CategoryBudget, 'id' | 'user_id' | 'created_at'>>;
      };
      opening_balance: {
        Row: OpeningBalance;
        Insert: Omit<OpeningBalance, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OpeningBalance, 'id' | 'user_id' | 'created_at'>>;
      };
      recurring_transactions: {
        Row: RecurringTransaction;
        Insert: Omit<RecurringTransaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at'>>;
      };
      security_settings: {
        Row: SecuritySettings;
        Insert: Omit<SecuritySettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SecuritySettings, 'id' | 'user_id' | 'created_at'>>;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at'>>;
      };
      security_audit_log: {
        Row: any; // Define if needed
        Insert: any;
        Update: any;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      transfer_between_accounts: {
        Args: {
          p_user_id: string;
          p_from_account_id: string;
          p_to_account_id: string;
          p_amount: number;
          p_transfer_fee: number;
          p_description: string;
          p_date: string;
        };
        Returns: void;
      };
      make_card_payment: {
        Args: {
          p_user_id: string;
          p_card_id: string;
          p_payment_amount: number;
          p_from_account_id: string;
          p_payment_method: string;
          p_payment_date: string;
          p_notes: string;
        };
        Returns: void;
      };
      make_loan_payment: {
        Args: {
          p_user_id: string;
          p_loan_id: string;
          p_payment_amount: number;
          p_from_account_id: string;
          p_payment_method: string;
          p_payment_date: string;
          p_late_fee: number;
          p_notes: string;
          p_receipt_number: string;
        };
        Returns: void;
      };
      receive_loan_payment: {
        Args: {
          p_user_id: string;
          p_loan_id: string;
          p_payment_amount: number;
          p_to_account_id: string;
          p_payment_method: string;
          p_payment_date: string;
          p_late_fee: number;
          p_notes: string;
          p_receipt_number: string;
        };
        Returns: void;
      };
      create_recurring_transaction: {
        Args: {
          recurring_id: string;
        };
        Returns: void;
      };
    };
    Enums: {
      asset_type: AssetType;
      asset_condition: AssetCondition;
      property_type: PropertyType;
      investment_type: InvestmentType;
      investment_status: InvestmentStatus;
      transaction_type: TransactionType;
      recurrence_interval: RecurrenceInterval;
    };
  };
}
