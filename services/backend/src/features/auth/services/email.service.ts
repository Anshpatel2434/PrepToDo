// =============================================================================
// Auth Feature - Email Service
// =============================================================================
import { Resend } from 'resend';
import { config } from '../../../config/index.js';
import { authLogger as logger } from '../../../common/utils/logger.js';

// =============================================================================
// Email Transporter
// =============================================================================
const resend = new Resend(config.resend.apiKey);

// =============================================================================
// Verify Email Service Connection
// =============================================================================
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    // Resend doesn't have a direct 'verify' connection method like SMTP.
    // We check if the API key is present.
    if (!config.resend.apiKey) {
      throw new Error('Resend API key is missing');
    }
    logger.info('Resend email service configured');
    return true;
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Email service configuration failed');
    return false;
  }
}

// =============================================================================
// Send OTP Email
// =============================================================================
export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f9fafb; color: #111827; -webkit-font-smoothing: antialiased; }
        .wrapper { max-width: 600px; margin: 40px auto; padding: 0 20px; }
        .container { background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: linear-gradient(135deg, #0F5F53 0%, #14B8A6 100%); padding: 48px 32px; text-align: center; }
        .logo { color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.025em; margin: 0; }
        .tagline { color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 8px 0 0 0; }
        .content { padding: 48px 40px; }
        .title { font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 16px 0; letter-spacing: -0.025em; }
        .text { font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 32px 0; }
        .otp-container { background-color: #f3f4f6; border-radius: 16px; padding: 32px; text-align: center; margin: 0 0 32px 0; border: 1px border #e5e7eb; }
        .otp-code { font-family: 'Inter', monospace; font-size: 48px; font-weight: 700; letter-spacing: 0.15em; color: #0F5F53; margin: 0; }
        .footer { padding: 32px 40px; text-align: center; border-top: 1px solid #f3f4f6; }
        .footer-text { font-size: 14px; color: #9ca3af; margin: 0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1 class="logo">PrepToDo</h1>
            <p class="tagline">Your learning journey starts here</p>
          </div>
          <div class="content">
            <h2 class="title">Verify your email</h2>
            <p class="text">Please enter the following verification code to complete your sign-in. This code will expire in 10 minutes.</p>
            <div class="otp-container">
              <p class="otp-code">${otp}</p>
            </div>
            <p class="text" style="font-size: 14px; text-align: center; margin-bottom: 0;">If you didn't request this code, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p class="footer-text">© ${new Date().getFullYear()} PrepToDo.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const { error } = await resend.emails.send({
    from: `"${config.resend.fromName}" <${config.resend.fromEmail}>`,
    to,
    subject: `${otp} is your verification code`,
    html,
  });

  if (error) {
    if (error.name === 'validation_error' && error.message?.includes('testing emails')) {
      logger.warn(
        `
=============================================================================
RESEND TEST MODE DETECTED
You can only send emails to the verified address (usually the account owner).
To send to other addresses, verify your domain at https://resend.com/domains
=============================================================================
        `
      );
    }
    logger.error({ error }, 'Failed to send OTP email via Resend');
    throw new Error('Failed to send OTP email');
  }
}

// =============================================================================
// Send Password Reset Email
// =============================================================================
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${config.frontendUrl}/auth/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f9fafb; color: #111827; -webkit-font-smoothing: antialiased; }
        .wrapper { max-width: 600px; margin: 40px auto; padding: 0 20px; }
        .container { background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: linear-gradient(135deg, #0F5F53 0%, #14B8A6 100%); padding: 48px 32px; text-align: center; }
        .logo { color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.025em; margin: 0; }
        .tagline { color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 8px 0 0 0; }
        .content { padding: 48px 40px; text-align: center; }
        .title { font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 16px 0; letter-spacing: -0.025em; }
        .text { font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 32px 0; }
        .button { display: inline-block; background-color: #0F5F53; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: 600; text-decoration: none; transition: background-color 0.2s; }
        .footer { padding: 32px 40px; text-align: center; border-top: 1px solid #f3f4f6; }
        .footer-text { font-size: 14px; color: #9ca3af; margin: 0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1 class="logo">PrepToDo</h1>
            <p class="tagline">Your learning journey starts here</p>
          </div>
          <div class="content">
            <h2 class="title">Reset your password</h2>
            <p class="text">We received a request to reset your password. Click the button below to choose a new one. This link will expire in 1 hour.</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p class="text" style="font-size: 14px; margin-top: 32px; margin-bottom: 0;">If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p class="footer-text">© ${new Date().getFullYear()} PrepToDo.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const { error } = await resend.emails.send({
    from: `"${config.resend.fromName}" <${config.resend.fromEmail}>`,
    to,
    subject: 'Reset your password',
    html,
  });

  if (error) {
    if (error.name === 'validation_error' && error.message?.includes('testing emails')) {
      logger.warn(
        `
=============================================================================
RESEND TEST MODE DETECTED
You can only send emails to the verified address (usually the account owner).
To send to other addresses, verify your domain at https://resend.com/domains
=============================================================================
        `
      );
    }
    logger.error({ error }, 'Failed to send password reset email via Resend');
    throw new Error('Failed to send password reset email');
  }
}