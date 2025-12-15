import { supabase } from "../apiClient";

export class EmailService {
  /**
   * Send OTP email to the user
   * @param email - User's email address
   * @returns Promise with success status and message
   */
  static async sendOTPEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp-email', {
        body: { email }
      });
      
      if (error) {
        console.error('Failed to send OTP email:', error);
        return { success: false, message: error.message };
      }
      
      return { success: true, message: data?.message || 'OTP sent successfully' };
    } catch (err) {
      const error = err as { message?: string };
      console.error('Error sending OTP email:', err);
      return { success: false, message: error.message || 'Failed to send OTP email' };
    }
  }

  /**
   * Verify OTP code
   * @param email - User's email address
   * @param otp - OTP code to verify
   * @returns Promise with success status, token, and message
   */
  static async verifyOTP(email: string, otp: string): Promise<{ success: boolean; token: string | null; message: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { email, otp }
      });
      
      if (error) {
        console.error('Failed to verify OTP:', error);
        return { success: false, token: null, message: error.message };
      }
      
      return {
        success: true,
        token: data?.token || null,
        message: data?.message || 'OTP verified successfully'
      };
    } catch (err) {
      const error = err as { message?: string };
      console.error('Error verifying OTP:', err);
      return { success: false, token: null, message: error.message || 'Failed to verify OTP' };
    }
  }

  /**
   * Generate a secure OTP code
   * @returns 6-digit OTP code
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate email format
   * @param email - Email address to validate
   * @returns true if valid email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Mask email for display (show only first 3 and last 2 characters)
   * @param email - Email address to mask
   * @returns Masked email string
   */
  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) return email;
    return `${localPart.slice(0, 3)}***@${domain}`;
  }
}