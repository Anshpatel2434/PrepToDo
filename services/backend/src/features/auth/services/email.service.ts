// =============================================================================
// Auth Feature - Email Service
// =============================================================================
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../../../config/index.js';

// =============================================================================
// Email Transporter
// =============================================================================
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });
  }
  return transporter;
}

// =============================================================================
// Verify Email Service Connection
// =============================================================================
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await getTransporter().verify();
    console.log('[EMAIL] SMTP connection verified');
    return true;
  } catch (error) {
    console.error('[EMAIL] SMTP connection failed:', error);
    return false;
  }
}

// =============================================================================
// Send OTP Email
// =============================================================================
export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">PrepToDo</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Your learning journey starts here</p>
        </div>
        
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin: 0 0 12px 0; font-size: 22px;">Verify Your Email</h2>
          <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6;">
            Use this code to complete your verification. It expires in <strong>10 minutes</strong>.
          </p>
          
          <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1f2937; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #9ca3af; margin: 24px 0 0 0; font-size: 13px; text-align: center;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} PrepToDo. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  await getTransporter().sendMail({
    from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
    to,
    subject: `${otp} is your verification code`,
    html,
  });
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
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">PrepToDo</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Password Reset Request</p>
        </div>
        
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin: 0 0 12px 0; font-size: 22px;">Reset Your Password</h2>
          <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6;">
            Click the button below to reset your password. This link expires in <strong>1 hour</strong>.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #9ca3af; margin: 24px 0 0 0; font-size: 13px; text-align: center;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} PrepToDo. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  await getTransporter().sendMail({
    from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
    to,
    subject: 'Reset your password',
    html,
  });
}