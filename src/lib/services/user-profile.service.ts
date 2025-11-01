import { supabase } from '../supabase/client';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
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

export interface ProfileStats {
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  activeGoals: number;
  activeBudgets: number;
  totalSavings: number;
  accountsConnected: number;
  memberSince: string;
}

/**
 * Get user profile by user ID
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

/**
 * Create or update user profile
 */
export const upsertUserProfile = async (
  userId: string,
  profileData: Partial<UserProfile>
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: userId,
          ...profileData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in upsertUserProfile:', error);
    return null;
  }
};

/**
 * Update user avatar
 */
export const updateAvatar = async (
  userId: string,
  file: File
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath);

    if (!urlData.publicUrl) {
      console.error('Error getting public URL');
      return null;
    }

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating profile with avatar URL:', updateError);
      return null;
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in updateAvatar:', error);
    return null;
  }
};

/**
 * Delete user avatar
 */
export const deleteAvatar = async (userId: string, avatarUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = avatarUrl.split('/');
    const filePath = `avatars/${urlParts[urlParts.length - 1]}`;

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('user-avatars')
      .remove([filePath]);

    if (deleteError) {
      console.error('Error deleting avatar from storage:', deleteError);
      return false;
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: null })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating profile after avatar deletion:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteAvatar:', error);
    return false;
  }
};

/**
 * Get user profile statistics
 */
export const getProfileStats = async (userId: string): Promise<ProfileStats | null> => {
  try {
    // Get transactions count and totals
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId);

    if (transError) throw transError;

    const totalIncome = transactions
      ?.filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const totalExpenses = transactions
      ?.filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    // Get goals count
    const { count: goalsCount, error: goalsError } = await supabase
      .from('financial_goals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'in_progress');

    if (goalsError) throw goalsError;

    // Get budgets count
    const { count: budgetsCount, error: budgetsError } = await supabase
      .from('budgets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (budgetsError) throw budgetsError;

    // Get bank accounts count
    const { count: accountsCount, error: accountsError } = await supabase
      .from('bank_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (accountsError) throw accountsError;

    // Get user creation date
    const { data: userData } = await supabase.auth.getUser();
    const memberSince = userData?.user?.created_at || new Date().toISOString();

    return {
      totalTransactions: transactions?.length || 0,
      totalIncome,
      totalExpenses,
      activeGoals: goalsCount || 0,
      activeBudgets: budgetsCount || 0,
      totalSavings: totalIncome - totalExpenses,
      accountsConnected: accountsCount || 0,
      memberSince,
    };
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    return null;
  }
};

/**
 * Get initials from full name
 */
export const getInitials = (name: string | null): string => {
  if (!name) return 'U';
  
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Validate profile data
 */
export const validateProfileData = (data: Partial<UserProfile>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.full_name && data.full_name.length > 100) {
    errors.push('Full name must be less than 100 characters');
  }

  if (data.bio && data.bio.length > 500) {
    errors.push('Bio must be less than 500 characters');
  }

  if (data.phone && !/^\+?[\d\s-()]+$/.test(data.phone)) {
    errors.push('Invalid phone number format');
  }

  if (data.date_of_birth) {
    const dob = new Date(data.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    if (age < 13) {
      errors.push('You must be at least 13 years old');
    }
    if (age > 120) {
      errors.push('Invalid date of birth');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
