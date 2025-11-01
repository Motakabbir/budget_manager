/**
 * Data Masking Utilities
 * 
 * Provides functions to mask sensitive financial data like account numbers,
 * card numbers, and amounts based on user security settings.
 */

/**
 * Mask account number - shows only last 4 digits
 * @param accountNumber - Full account number
 * @param enabled - Whether masking is enabled
 * @returns Masked account number (e.g., "****1234")
 */
export function maskAccountNumber(accountNumber: string | null | undefined, enabled: boolean = true): string {
    if (!accountNumber) return 'N/A';
    if (!enabled) return accountNumber;
    
    const cleaned = accountNumber.replace(/\s/g, '');
    if (cleaned.length <= 4) return cleaned;
    
    const lastFour = cleaned.slice(-4);
    return `****${lastFour}`;
}

/**
 * Mask card number - shows only last 4 digits
 * @param cardNumber - Full card number
 * @param enabled - Whether masking is enabled
 * @returns Masked card number (e.g., "**** **** **** 1234")
 */
export function maskCardNumber(cardNumber: string | null | undefined, enabled: boolean = true): string {
    if (!cardNumber) return 'N/A';
    if (!enabled) return formatCardNumber(cardNumber);
    
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length <= 4) return cleaned;
    
    const lastFour = cleaned.slice(-4);
    return `**** **** **** ${lastFour}`;
}

/**
 * Format card number with spaces (for display without masking)
 * @param cardNumber - Card number
 * @returns Formatted card number (e.g., "1234 5678 9012 3456")
 */
export function formatCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
}

/**
 * Mask amount - shows as "***"
 * @param amount - Numeric amount
 * @param enabled - Whether masking is enabled
 * @param currency - Currency symbol (default: '$')
 * @returns Masked or formatted amount
 */
export function maskAmount(amount: number, enabled: boolean = false, currency: string = '$'): string {
    if (!enabled) {
        return `${currency}${amount.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`;
    }
    
    return `${currency}***`;
}

/**
 * Mask email address - shows first 3 chars and domain
 * @param email - Email address
 * @param enabled - Whether masking is enabled
 * @returns Masked email (e.g., "joh***@example.com")
 */
export function maskEmail(email: string | null | undefined, enabled: boolean = false): string {
    if (!email) return 'N/A';
    if (!enabled) return email;
    
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    
    const maskedLocal = localPart.length <= 3 
        ? localPart 
        : `${localPart.slice(0, 3)}***`;
    
    return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number - shows only last 4 digits
 * @param phone - Phone number
 * @param enabled - Whether masking is enabled
 * @returns Masked phone (e.g., "***-***-1234")
 */
export function maskPhoneNumber(phone: string | null | undefined, enabled: boolean = false): string {
    if (!phone) return 'N/A';
    if (!enabled) return phone;
    
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 4) return cleaned;
    
    const lastFour = cleaned.slice(-4);
    return `***-***-${lastFour}`;
}

/**
 * Mask SSN/Tax ID - shows only last 4 digits
 * @param ssn - Social Security Number or Tax ID
 * @param enabled - Whether masking is enabled
 * @returns Masked SSN (e.g., "***-**-1234")
 */
export function maskSSN(ssn: string | null | undefined, enabled: boolean = true): string {
    if (!ssn) return 'N/A';
    if (!enabled) return ssn;
    
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length <= 4) return cleaned;
    
    const lastFour = cleaned.slice(-4);
    return `***-**-${lastFour}`;
}

/**
 * Mask IBAN - shows only last 4 characters
 * @param iban - International Bank Account Number
 * @param enabled - Whether masking is enabled
 * @returns Masked IBAN (e.g., "****1234")
 */
export function maskIBAN(iban: string | null | undefined, enabled: boolean = true): string {
    if (!iban) return 'N/A';
    if (!enabled) return iban;
    
    const cleaned = iban.replace(/\s/g, '');
    if (cleaned.length <= 4) return cleaned;
    
    const lastFour = cleaned.slice(-4);
    return `****${lastFour}`;
}

/**
 * Mask routing number - shows only last 3 digits
 * @param routingNumber - Bank routing number
 * @param enabled - Whether masking is enabled
 * @returns Masked routing number (e.g., "******123")
 */
export function maskRoutingNumber(routingNumber: string | null | undefined, enabled: boolean = true): string {
    if (!routingNumber) return 'N/A';
    if (!enabled) return routingNumber;
    
    const cleaned = routingNumber.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    
    const lastThree = cleaned.slice(-3);
    const asterisks = '*'.repeat(cleaned.length - 3);
    return `${asterisks}${lastThree}`;
}

/**
 * Partially mask name - shows first name and last initial
 * @param fullName - Full name
 * @param enabled - Whether masking is enabled
 * @returns Partially masked name (e.g., "John D.")
 */
export function maskName(fullName: string | null | undefined, enabled: boolean = false): string {
    if (!fullName) return 'N/A';
    if (!enabled) return fullName;
    
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return fullName;
    
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1][0];
    return `${firstName} ${lastInitial}.`;
}

/**
 * Get masked version of any sensitive field based on type
 * @param value - Value to mask
 * @param type - Type of value ('account', 'card', 'amount', etc.)
 * @param enabled - Whether masking is enabled
 * @returns Masked value
 */
export function maskField(
    value: any, 
    type: 'account' | 'card' | 'amount' | 'email' | 'phone' | 'ssn' | 'iban' | 'routing' | 'name',
    enabled: boolean = true
): string {
    switch (type) {
        case 'account':
            return maskAccountNumber(value, enabled);
        case 'card':
            return maskCardNumber(value, enabled);
        case 'amount':
            return maskAmount(value, enabled);
        case 'email':
            return maskEmail(value, enabled);
        case 'phone':
            return maskPhoneNumber(value, enabled);
        case 'ssn':
            return maskSSN(value, enabled);
        case 'iban':
            return maskIBAN(value, enabled);
        case 'routing':
            return maskRoutingNumber(value, enabled);
        case 'name':
            return maskName(value, enabled);
        default:
            return value?.toString() || 'N/A';
    }
}

/**
 * Check if a value appears to be sensitive data
 * @param value - Value to check
 * @returns True if value looks like sensitive data
 */
export function isSensitiveData(value: any): boolean {
    if (typeof value !== 'string') return false;
    
    const cleaned = value.replace(/\D/g, '');
    
    // Check for patterns that look like:
    // - Card numbers (13-19 digits)
    // - Account numbers (8-17 digits)
    // - SSN (9 digits)
    // - Phone numbers (10-11 digits)
    if (cleaned.length >= 8 && cleaned.length <= 19) {
        return true;
    }
    
    // Check for email patterns
    if (value.includes('@') && value.includes('.')) {
        return true;
    }
    
    return false;
}

/**
 * Sanitize data for logging (mask all sensitive fields)
 * @param data - Data object to sanitize
 * @returns Sanitized data object with masked sensitive fields
 */
export function sanitizeForLogging(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    const sensitiveKeys = [
        'password', 'pin', 'cvv', 'cvc', 'security_code',
        'card_number', 'account_number', 'routing_number',
        'ssn', 'tax_id', 'iban', 'swift'
    ];
    
    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        
        // Completely hide these fields
        if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
            sanitized[key] = '[REDACTED]';
        }
        // Mask if it looks like sensitive data
        else if (isSensitiveData(value)) {
            if (typeof value === 'string' && value.length > 4) {
                sanitized[key] = `****${value.slice(-4)}`;
            } else {
                sanitized[key] = '[MASKED]';
            }
        }
        // Keep other values as is
        else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

/**
 * Format currency amount with proper symbols and locale
 * @param amount - Numeric amount
 * @param currency - Currency code (USD, EUR, GBP, etc.)
 * @param masked - Whether to mask the amount
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD', masked: boolean = false): string {
    if (masked) {
        return `${getCurrencySymbol(currency)}***`;
    }
    
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Get currency symbol from currency code
 * @param currency - Currency code (USD, EUR, etc.)
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: string = 'USD'): string {
    const symbols: Record<string, string> = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CNY': '¥',
        'INR': '₹',
        'AUD': 'A$',
        'CAD': 'C$',
        'CHF': 'Fr',
        'SEK': 'kr',
        'NZD': 'NZ$',
    };
    
    return symbols[currency.toUpperCase()] || currency;
}
