// =============================================================================
// Auth Feature - Email Validator Service
// =============================================================================
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

// =============================================================================
// Disposable Email Domains Blocklist
// =============================================================================
const DISPOSABLE_DOMAINS = new Set([
    'tempmail.com',
    'throwaway.email',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'temp-mail.org',
    'fakeinbox.com',
    'trashmail.com',
    'yopmail.com',
    'mailnesia.com',
    'maildrop.cc',
    'dispostable.com',
    'getnada.com',
    'sharklasers.com',
    'guerrillamail.info',
    'grr.la',
    'spam4.me',
]);

// =============================================================================
// Email Syntax Validation
// =============================================================================
export function isValidEmailSyntax(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) return false;
    if (email.length > 254) return false;

    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return false;
    if (localPart.length > 64) return false;
    if (domain.length > 253) return false;

    return true;
}

// =============================================================================
// Check for Disposable Email
// =============================================================================
export function isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

// =============================================================================
// Verify MX Records
// =============================================================================
export async function hasMxRecords(email: string): Promise<boolean> {
    const domain = email.split('@')[1];
    if (!domain) return false;

    try {
        const records = await resolveMx(domain);
        return records.length > 0;
    } catch {
        return false;
    }
}

// =============================================================================
// Combined Validation
// =============================================================================
export interface EmailValidationResult {
    valid: boolean;
    reason?: string;
}

export async function validateEmail(email: string): Promise<EmailValidationResult> {
    // Basic syntax check
    if (!isValidEmailSyntax(email)) {
        return { valid: false, reason: 'Invalid email format' };
    }

    // Disposable email check
    if (isDisposableEmail(email)) {
        return { valid: false, reason: 'Disposable emails are not allowed' };
    }

    // MX record check (for email deliverability)
    const hasMx = await hasMxRecords(email);
    if (!hasMx) {
        return { valid: false, reason: 'Email domain does not accept emails' };
    }

    return { valid: true };
}
