// =============================================================================
// Auth Feature - OTP Service
// =============================================================================
import crypto from 'crypto';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

// =============================================================================
// Generate 6-Digit OTP
// =============================================================================
export function generateOtp(): string {
    const min = Math.pow(10, OTP_LENGTH - 1);
    const max = Math.pow(10, OTP_LENGTH) - 1;
    const otp = crypto.randomInt(min, max + 1);
    return otp.toString().padStart(OTP_LENGTH, '0');
}

// =============================================================================
// Hash OTP for Storage
// =============================================================================
export function hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
}

// =============================================================================
// Verify OTP
// =============================================================================
export function verifyOtp(otp: string, hashedOtp: string): boolean {
    const inputHash = hashOtp(otp);
    return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hashedOtp));
}

// =============================================================================
// Get OTP Expiry Date
// =============================================================================
export function getOtpExpiryDate(): Date {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + OTP_EXPIRY_MINUTES);
    return expiry;
}

// =============================================================================
// Check if OTP is Expired
// =============================================================================
export function isOtpExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
}
