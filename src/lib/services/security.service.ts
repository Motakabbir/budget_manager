/**
 * Security Service
 * 
 * Handles PIN protection, biometric authentication, and security settings
 */

import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export type SecuritySettings = {
    id: string;
    user_id: string;
    pin_enabled: boolean;
    pin_hash: string | null;
    pin_salt: string | null;
    pin_attempts: number;
    pin_locked_until: string | null;
    biometric_enabled: boolean;
    biometric_type: 'fingerprint' | 'face' | 'iris' | null;
    biometric_credential_id: string | null;
    auto_logout_enabled: boolean;
    auto_logout_minutes: number;
    last_activity_at: string;
    data_masking_enabled: boolean;
    mask_account_numbers: boolean;
    mask_card_numbers: boolean;
    mask_amounts: boolean;
    require_pin_on_launch: boolean;
    require_biometric_on_launch: boolean;
    lock_on_minimize: boolean;
    created_at: string;
    updated_at: string;
};

export type SecurityAuditLog = {
    id: string;
    user_id: string;
    event_type: string;
    event_description: string | null;
    ip_address: string | null;
    user_agent: string | null;
    device_type: string | null;
    success: boolean;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    metadata: Record<string, any> | null;
    created_at: string;
};

// ============================================================================
// PIN Protection
// ============================================================================

/**
 * Hash a PIN using Web Crypto API
 */
async function hashPIN(pin: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const encoder = new TextEncoder();
    
    // Generate salt if not provided
    if (!salt) {
        const saltArray = crypto.getRandomValues(new Uint8Array(16));
        salt = Array.from(saltArray, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Combine PIN with salt
    const data = encoder.encode(pin + salt);
    
    // Hash using SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    
    return { hash, salt };
}

/**
 * Verify a PIN against stored hash
 */
async function verifyPIN(pin: string, storedHash: string, salt: string): Promise<boolean> {
    const { hash } = await hashPIN(pin, salt);
    return hash === storedHash;
}

/**
 * Create or update PIN
 */
export async function setupPIN(pin: string): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        // Validate PIN (4-6 digits)
        if (!/^\d{4,6}$/.test(pin)) {
            toast.error('Invalid PIN', { description: 'PIN must be 4-6 digits' });
            return false;
        }
        
        // Hash the PIN
        const { hash, salt } = await hashPIN(pin);
        
        // Save to database
        const { error } = await supabase
            .from('user_security_settings')
            .upsert({
                user_id: user.id,
                pin_enabled: true,
                pin_hash: hash,
                pin_salt: salt,
                pin_attempts: 0,
                pin_locked_until: null,
            });
        
        if (error) throw error;
        
        // Log the event
        await logSecurityEvent('pin_created', 'PIN protection enabled', true, 'low');
        
        toast.success('PIN set successfully');
        return true;
    } catch (error: any) {
        console.error('Error setting up PIN:', error);
        toast.error('Failed to set up PIN', { description: error.message });
        return false;
    }
}

/**
 * Verify PIN entry
 */
export async function verifyPINEntry(pin: string): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        // Get security settings
        const { data: settings, error } = await supabase
            .from('user_security_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (error) throw error;
        if (!settings || !settings.pin_enabled) {
            toast.error('PIN not set up');
            return false;
        }
        
        // Check if locked
        if (settings.pin_locked_until) {
            const lockedUntil = new Date(settings.pin_locked_until);
            if (lockedUntil > new Date()) {
                const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
                toast.error('PIN locked', { 
                    description: `Too many failed attempts. Try again in ${minutesLeft} minutes.` 
                });
                return false;
            }
        }
        
        // Verify PIN
        const isValid = await verifyPIN(pin, settings.pin_hash!, settings.pin_salt!);
        
        if (isValid) {
            // Reset attempts on success
            await supabase
                .from('user_security_settings')
                .update({ 
                    pin_attempts: 0, 
                    pin_locked_until: null,
                    last_activity_at: new Date().toISOString()
                })
                .eq('user_id', user.id);
            
            await logSecurityEvent('login_success', 'PIN verification successful', true, 'low');
            return true;
        } else {
            // Increment attempts
            const newAttempts = settings.pin_attempts + 1;
            const updateData: any = { pin_attempts: newAttempts };
            
            // Lock after 5 failed attempts
            if (newAttempts >= 5) {
                const lockUntil = new Date(Date.now() + 15 * 60000); // 15 minutes
                updateData.pin_locked_until = lockUntil.toISOString();
                
                await logSecurityEvent(
                    'pin_locked',
                    'PIN locked due to too many failed attempts',
                    false,
                    'high',
                    { attempts: newAttempts }
                );
                
                toast.error('PIN locked', { 
                    description: 'Too many failed attempts. Locked for 15 minutes.' 
                });
            } else {
                await logSecurityEvent(
                    'pin_failure',
                    `PIN verification failed (attempt ${newAttempts}/5)`,
                    false,
                    'medium'
                );
                
                toast.error('Incorrect PIN', { 
                    description: `${5 - newAttempts} attempts remaining` 
                });
            }
            
            await supabase
                .from('user_security_settings')
                .update(updateData)
                .eq('user_id', user.id);
            
            return false;
        }
    } catch (error: any) {
        console.error('Error verifying PIN:', error);
        toast.error('PIN verification failed', { description: error.message });
        return false;
    }
}

/**
 * Disable PIN protection
 */
export async function disablePIN(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        const { error } = await supabase
            .from('user_security_settings')
            .update({
                pin_enabled: false,
                pin_hash: null,
                pin_salt: null,
                pin_attempts: 0,
                pin_locked_until: null,
            })
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        await logSecurityEvent('settings_changed', 'PIN protection disabled', true, 'low');
        toast.success('PIN protection disabled');
        return true;
    } catch (error: any) {
        console.error('Error disabling PIN:', error);
        toast.error('Failed to disable PIN', { description: error.message });
        return false;
    }
}

// ============================================================================
// Biometric Authentication (WebAuthn)
// ============================================================================

/**
 * Check if biometric authentication is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
    if (!window.PublicKeyCredential) {
        return false;
    }
    
    try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
    } catch (error) {
        console.error('Error checking biometric availability:', error);
        return false;
    }
}

/**
 * Enroll biometric authentication
 */
export async function enrollBiometric(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        if (!(await isBiometricAvailable())) {
            toast.error('Biometric authentication not available on this device');
            return false;
        }
        
        // Create credential
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const publicKeyOptions: PublicKeyCredentialCreationOptions = {
            challenge,
            rp: {
                name: 'Budget Manager',
                id: window.location.hostname,
            },
            user: {
                id: new TextEncoder().encode(user.id),
                name: user.email || 'user',
                displayName: user.email || 'User',
            },
            pubKeyCredParams: [
                { alg: -7, type: 'public-key' }, // ES256
                { alg: -257, type: 'public-key' }, // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required',
            },
            timeout: 60000,
        };
        
        const credential = await navigator.credentials.create({
            publicKey: publicKeyOptions,
        }) as PublicKeyCredential;
        
        if (!credential) {
            throw new Error('Failed to create credential');
        }
        
        // Store credential ID
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        
        const { error } = await supabase
            .from('user_security_settings')
            .upsert({
                user_id: user.id,
                biometric_enabled: true,
                biometric_credential_id: credentialId,
                biometric_type: 'fingerprint', // Default, could detect actual type
            });
        
        if (error) throw error;
        
        await logSecurityEvent('biometric_enrolled', 'Biometric authentication enrolled', true, 'low');
        toast.success('Biometric authentication enabled');
        return true;
    } catch (error: any) {
        console.error('Error enrolling biometric:', error);
        if (error.name === 'NotAllowedError') {
            toast.error('Biometric enrollment cancelled');
        } else {
            toast.error('Failed to enroll biometric', { description: error.message });
        }
        return false;
    }
}

/**
 * Verify biometric authentication
 */
export async function verifyBiometric(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        // Get settings
        const { data: settings, error } = await supabase
            .from('user_security_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (error) throw error;
        if (!settings || !settings.biometric_enabled) {
            toast.error('Biometric authentication not set up');
            return false;
        }
        
        // Request authentication
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const credentialId = Uint8Array.from(atob(settings.biometric_credential_id!), c => c.charCodeAt(0));
        
        const publicKeyOptions: PublicKeyCredentialRequestOptions = {
            challenge,
            allowCredentials: [{
                id: credentialId,
                type: 'public-key',
            }],
            userVerification: 'required',
            timeout: 60000,
        };
        
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyOptions,
        });
        
        if (!assertion) {
            throw new Error('Biometric verification failed');
        }
        
        // Update last activity
        await supabase
            .from('user_security_settings')
            .update({ last_activity_at: new Date().toISOString() })
            .eq('user_id', user.id);
        
        await logSecurityEvent('login_success', 'Biometric verification successful', true, 'low');
        return true;
    } catch (error: any) {
        console.error('Error verifying biometric:', error);
        await logSecurityEvent('biometric_failure', 'Biometric verification failed', false, 'medium');
        
        if (error.name === 'NotAllowedError') {
            toast.error('Biometric verification cancelled');
        } else {
            toast.error('Biometric verification failed', { description: error.message });
        }
        return false;
    }
}

/**
 * Disable biometric authentication
 */
export async function disableBiometric(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        const { error } = await supabase
            .from('user_security_settings')
            .update({
                biometric_enabled: false,
                biometric_credential_id: null,
                biometric_type: null,
            })
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        await logSecurityEvent('biometric_removed', 'Biometric authentication disabled', true, 'low');
        toast.success('Biometric authentication disabled');
        return true;
    } catch (error: any) {
        console.error('Error disabling biometric:', error);
        toast.error('Failed to disable biometric', { description: error.message });
        return false;
    }
}

// ============================================================================
// Security Settings
// ============================================================================

/**
 * Get user security settings
 */
export async function getSecuritySettings(): Promise<SecuritySettings | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const { data, error } = await supabase
            .from('user_security_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (error) throw error;
        return data as SecuritySettings;
    } catch (error: any) {
        console.error('Error getting security settings:', error);
        return null;
    }
}

/**
 * Update security settings
 */
export async function updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        const { error } = await supabase
            .from('user_security_settings')
            .update(settings)
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        await logSecurityEvent('settings_changed', 'Security settings updated', true, 'low');
        toast.success('Security settings updated');
        return true;
    } catch (error: any) {
        console.error('Error updating security settings:', error);
        toast.error('Failed to update settings', { description: error.message });
        return false;
    }
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Update last activity timestamp
 */
export async function updateLastActivity(): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        await supabase
            .from('user_security_settings')
            .update({ last_activity_at: new Date().toISOString() })
            .eq('user_id', user.id);
    } catch (error) {
        console.error('Error updating last activity:', error);
    }
}

/**
 * Check if session is expired
 */
export async function isSessionExpired(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return true;
        
        const { data, error } = await supabase
            .from('user_security_settings')
            .select('auto_logout_enabled, auto_logout_minutes, last_activity_at')
            .eq('user_id', user.id)
            .single();
        
        if (error || !data) return false;
        
        if (!data.auto_logout_enabled) return false;
        
        const lastActivity = new Date(data.last_activity_at);
        const now = new Date();
        const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / 60000;
        
        return minutesSinceActivity >= data.auto_logout_minutes;
    } catch (error) {
        console.error('Error checking session expiry:', error);
        return false;
    }
}

// ============================================================================
// Audit Logging
// ============================================================================

/**
 * Log a security event
 */
export async function logSecurityEvent(
    eventType: string,
    description: string | null = null,
    success: boolean = true,
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low',
    metadata: Record<string, any> | null = null
): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        await supabase.from('security_audit_log').insert({
            user_id: user.id,
            event_type: eventType,
            event_description: description,
            success,
            risk_level: riskLevel,
            metadata,
            ip_address: null, // Could be captured if needed
            user_agent: navigator.userAgent,
            device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        });
    } catch (error) {
        console.error('Error logging security event:', error);
    }
}

/**
 * Get security audit logs
 */
export async function getSecurityLogs(limit: number = 50): Promise<SecurityAuditLog[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        
        const { data, error } = await supabase
            .from('security_audit_log')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data as SecurityAuditLog[];
    } catch (error: any) {
        console.error('Error getting security logs:', error);
        return [];
    }
}
