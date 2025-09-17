import nodemailer from 'nodemailer';
import httpStatus from 'http-status';

// Email configuration with Gmail SMTP
const emailConfig = {
  service: 'gmail',
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true' || parseInt(process.env.EMAIL_PORT || '587') === 465,
  auth: {
    user: process.env.EMAIL_USERNAME || 'contactpawsiq@gmail.com',
    pass: process.env.EMAIL_PASSWORD
  },
  connectionTimeout: parseInt(process.env.EMAIL_CONNECTION_TIMEOUT || '10000'), // 10s
  greetingTimeout: parseInt(process.env.EMAIL_GREETING_TIMEOUT || '10000'), // 10s
  socketTimeout: parseInt(process.env.EMAIL_SOCKET_TIMEOUT || '10000'), // 10s
  pool: process.env.EMAIL_POOL === 'true',
  tls: {
    rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED
      ? process.env.EMAIL_TLS_REJECT_UNAUTHORIZED === 'true'
      : process.env.NODE_ENV === 'production'
  }
};

// Only enable email if credentials are configured and not explicitly disabled
const EMAIL_DISABLED = process.env.EMAIL_DISABLED === 'true';
const EMAIL_READY = !!(process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD) && !EMAIL_DISABLED;

let transporter: nodemailer.Transporter | null = null;
const getTransporter = () => {
  if (!EMAIL_READY) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport(emailConfig);
  }
  return transporter;
};

const verifyEmailConnection = async () => {
  const tx = getTransporter();
  if (!tx) {
    console.warn('Email disabled or not configured. Skipping SMTP verify.');
    return false;
  }
  try {
    await tx.verify();
    return true;
  } catch (error) {
    console.error('SMTP Connection Error:', error);
    return false;
  }
};

if (process.env.NODE_ENV !== 'production') {
  verifyEmailConnection();
}

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!EMAIL_READY) {
    console.warn('Email credentials not configured. Email not sent.');
    return null;
  }

  try {
    const tx = getTransporter();
    if (!tx) return null;
    const info = await tx.sendMail({
      from: `"PawsIQ" <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME || 'noreply@pawsiq.com'}>`,
      to,
      subject,
      html,
    });

    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendOTPEmail = async (to: string, otp: string) => {
  const subject = 'Your PawsIQ Password Reset OTP';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Password Reset OTP</h2>
      <p>You have requested to reset your password. Please use the following OTP to verify your identity:</p>
      <div style="margin: 25px 0; text-align: center;">
        <div style="display: inline-block; 
                    background-color: #f3f4f6; 
                    padding: 15px 30px; 
                    border-radius: 5px; 
                    font-size: 24px; 
                    font-weight: bold; 
                    letter-spacing: 2px;
                    color: #1f2937;">
          ${otp}
        </div>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
      <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email or contact support if you have concerns.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        This is an automated message, please do not reply to this email.
      </p>
    </div>`;

  return sendEmail(to, subject, html);
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/user/reset-password?token=${token}`;
  
  const subject = 'Reset your PawsIQ password';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #111827;">Reset Your Password</h2>
      <p style="color: #4b5563; line-height: 1.6;">You requested a password reset. Click the button below to set a new password:</p>
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" 
           style="display: inline-block; 
                  background-color: #4F46E5; 
                  color: white; 
                  padding: 12px 24px; 
                  text-decoration: none; 
                  border-radius: 6px; 
                  font-weight: 600;
                  font-size: 16px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  transition: background-color 0.2s;
                  text-align: center;
                  min-width: 200px;">
          Reset Password
        </a>
      </div>
      <p style="color: #4b5563; margin-bottom: 8px;">Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; 
                background-color: #f9fafb; 
                padding: 12px; 
                border-radius: 4px; 
                font-size: 14px; 
                color: #374151;
                border: 1px solid #e5e7eb;">
        ${resetUrl}
      </p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This email was sent to ${to}. If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;

  return sendEmail(to, subject, html);
};

