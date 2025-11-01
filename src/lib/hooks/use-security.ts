/**
 * Security Hooks
 * 
 * React hooks for managing security features like PIN, biometric auth,
 * auto-logout, and data masking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useRef } from 'react';
import {
    getSecuritySettings,
    updateSecuritySettings,
    setupPIN,
    verifyPINEntry,
    disablePIN,
    enrollBiometric,
    verifyBiometric,
    disableBiometric,
    isBiometricAvailable,
    updateLastActivity,
    isSessionExpired,
    logSecurityEvent,
    getSecurityLogs,
    SecuritySettings,
    SecurityAuditLog,
} from '@/lib/services/security.service';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// Security Settings Hooks
// ============================================================================

/**
 * Hook to get security settings
 */
export function useSecuritySettings() {
    return useQuery<SecuritySettings | null>({
        queryKey: ['security-settings'],
        queryFn: getSecuritySettings,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to update security settings
 */
export function useUpdateSecuritySettings() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (settings: Partial<SecuritySettings>) => updateSecuritySettings(settings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-settings'] });
        },
    });
}

// ============================================================================
// PIN Protection Hooks
// ============================================================================

/**
 * Hook to set up PIN
 */
export function useSetupPIN() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (pin: string) => setupPIN(pin),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-settings'] });
        },
    });
}

/**
 * Hook to verify PIN
 */
export function useVerifyPIN() {
    return useMutation({
        mutationFn: (pin: string) => verifyPINEntry(pin),
    });
}

/**
 * Hook to disable PIN
 */
export function useDisablePIN() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: () => disablePIN(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-settings'] });
        },
    });
}

// ============================================================================
// Biometric Authentication Hooks
// ============================================================================

/**
 * Hook to check biometric availability
 */
export function useBiometricAvailability() {
    return useQuery({
        queryKey: ['biometric-available'],
        queryFn: isBiometricAvailable,
        staleTime: Infinity, // Doesn't change during session
    });
}

/**
 * Hook to enroll biometric
 */
export function useEnrollBiometric() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: () => enrollBiometric(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-settings'] });
        },
    });
}

/**
 * Hook to verify biometric
 */
export function useVerifyBiometric() {
    return useMutation({
        mutationFn: () => verifyBiometric(),
    });
}

/**
 * Hook to disable biometric
 */
export function useDisableBiometric() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: () => disableBiometric(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-settings'] });
        },
    });
}

// ============================================================================
// Auto-Logout Hook
// ============================================================================

/**
 * Hook to manage auto-logout functionality
 * Monitors user activity and logs out after inactivity period
 */
export function useAutoLogout() {
    const { data: settings } = useSecuritySettings();
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const handleActivity = useCallback(() => {
        // Debounce activity updates to avoid too many DB writes
        if (activityTimeoutRef.current) {
            clearTimeout(activityTimeoutRef.current);
        }
        
        activityTimeoutRef.current = setTimeout(() => {
            updateLastActivity();
        }, 5000); // Update every 5 seconds of activity
    }, []);
    
    const checkExpiry = useCallback(async () => {
        if (!settings?.auto_logout_enabled) return;
        
        const expired = await isSessionExpired();
        if (expired) {
            await logSecurityEvent('auto_logout', 'Session expired due to inactivity', true, 'low');
            toast.info('Session expired', { description: 'You have been logged out due to inactivity' });
            await supabase.auth.signOut();
            window.location.href = '/';
        }
    }, [settings]);
    
    useEffect(() => {
        if (!settings?.auto_logout_enabled) {
            // Clean up if auto-logout is disabled
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
            return;
        }
        
        // Activity events to monitor
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        
        // Add activity listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });
        
        // Check session expiry every 30 seconds
        checkIntervalRef.current = setInterval(checkExpiry, 30000);
        
        // Initial check
        checkExpiry();
        
        return () => {
            // Clean up
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
            
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
        };
    }, [settings, handleActivity, checkExpiry]);
}

// ============================================================================
// PIN Lock Screen Hook
// ============================================================================

/**
 * Hook to manage PIN lock screen state
 * Shows lock screen when app is launched or after timeout
 */
export function usePINLockScreen() {
    const { data: settings } = useSecuritySettings();
    const isLockedRef = useRef(false);
    
    useEffect(() => {
        const checkLockRequirement = async () => {
            if (!settings) return;
            
            // Check if PIN is required on launch
            if (settings.require_pin_on_launch && settings.pin_enabled && !isLockedRef.current) {
                isLockedRef.current = true;
                // Trigger lock screen (handled by parent component)
                window.dispatchEvent(new CustomEvent('show-pin-lock'));
            }
            
            // Check if biometric is required on launch
            if (settings.require_biometric_on_launch && settings.biometric_enabled && !isLockedRef.current) {
                isLockedRef.current = true;
                window.dispatchEvent(new CustomEvent('show-biometric-lock'));
            }
        };
        
        checkLockRequirement();
        
        // Handle visibility change (lock on minimize if enabled)
        const handleVisibilityChange = () => {
            if (document.hidden && settings?.lock_on_minimize) {
                isLockedRef.current = false; // Allow re-locking
            } else if (!document.hidden && settings?.lock_on_minimize) {
                checkLockRequirement();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [settings]);
}

// ============================================================================
// Data Masking Hook
// ============================================================================

/**
 * Hook to get data masking settings
 * Returns functions to check if specific data types should be masked
 */
export function useDataMasking() {
    const { data: settings } = useSecuritySettings();
    
    return {
        isEnabled: settings?.data_masking_enabled ?? true,
        maskAccountNumbers: settings?.mask_account_numbers ?? true,
        maskCardNumbers: settings?.mask_card_numbers ?? true,
        maskAmounts: settings?.mask_amounts ?? false,
        shouldMask: (type: 'account' | 'card' | 'amount') => {
            if (!settings?.data_masking_enabled) return false;
            
            switch (type) {
                case 'account':
                    return settings?.mask_account_numbers ?? true;
                case 'card':
                    return settings?.mask_card_numbers ?? true;
                case 'amount':
                    return settings?.mask_amounts ?? false;
                default:
                    return false;
            }
        },
    };
}

// ============================================================================
// Security Audit Log Hook
// ============================================================================

/**
 * Hook to get security audit logs
 */
export function useSecurityLogs(limit: number = 50) {
    return useQuery<SecurityAuditLog[]>({
        queryKey: ['security-logs', limit],
        queryFn: () => getSecurityLogs(limit),
        staleTime: 1000 * 60, // 1 minute
    });
}

// ============================================================================
// Security Status Hook
// ============================================================================

/**
 * Hook to get overall security status
 * Provides a summary of enabled security features
 */
export function useSecurityStatus() {
    const { data: settings } = useSecuritySettings();
    const { data: biometricAvailable } = useBiometricAvailability();
    
    return {
        pinEnabled: settings?.pin_enabled ?? false,
        biometricEnabled: settings?.biometric_enabled ?? false,
        biometricAvailable: biometricAvailable ?? false,
        autoLogoutEnabled: settings?.auto_logout_enabled ?? false,
        dataMaskingEnabled: settings?.data_masking_enabled ?? false,
        securityScore: calculateSecurityScore(settings),
    };
}

/**
 * Calculate security score based on enabled features
 */
function calculateSecurityScore(settings: SecuritySettings | null | undefined): number {
    if (!settings) return 0;
    
    let score = 0;
    
    // PIN protection (30 points)
    if (settings.pin_enabled) score += 30;
    
    // Biometric authentication (30 points)
    if (settings.biometric_enabled) score += 30;
    
    // Auto-logout (20 points)
    if (settings.auto_logout_enabled) score += 20;
    
    // Data masking (10 points)
    if (settings.data_masking_enabled) score += 10;
    
    // Require auth on launch (10 points)
    if (settings.require_pin_on_launch || settings.require_biometric_on_launch) {
        score += 10;
    }
    
    return score;
}

// ============================================================================
// Encryption Helper Hook
// ============================================================================

/**
 * Hook to encrypt/decrypt sensitive data
 * Uses Web Crypto API for client-side encryption
 */
export function useEncryption() {
    const encryptData = useCallback(async (data: string, key?: CryptoKey): Promise<string> => {
        try {
            // Generate key if not provided
            if (!key) {
                key = await crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt', 'decrypt']
                );
            }
            
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            const encryptedBuffer = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                dataBuffer
            );
            
            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encryptedBuffer), iv.length);
            
            // Convert to base64
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    }, []);
    
    const decryptData = useCallback(async (encryptedData: string, key: CryptoKey): Promise<string> => {
        try {
            // Decode from base64
            const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
            
            // Extract IV and encrypted data
            const iv = combined.slice(0, 12);
            const data = combined.slice(12);
            
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                data
            );
            
            const decoder = new TextDecoder();
            return decoder.decode(decryptedBuffer);
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data');
        }
    }, []);
    
    return { encryptData, decryptData };
}
