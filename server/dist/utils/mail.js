import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
let transporter = null;
function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_PORT === 465,
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });
    }
    return transporter;
}
export async function sendOtpEmail(toEmail, otp, restaurantName) {
    console.log(`\n========================================`);
    console.log(`📩 [OTP DISPATCH] Recipient: ${toEmail}`);
    console.log(`🔐 [VERIFICATION CODE]: ${otp}`);
    console.log(`========================================\n`);
    if (!env.SMTP_USER || !env.SMTP_PASS) {
        console.warn('⚠️ SMTP credentials not set, OTP logged to console above.');
        return { success: true, devOtp: otp };
    }
    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 32px 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">RestoPOS Cloud</h1>
        <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Restaurant Management SaaS Platform</p>
      </div>
      <div style="padding: 36px 32px; color: #1e293b;">
        <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">Verify Your Email Address</h2>
        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
          Hello ${restaurantName ? `team <strong>${restaurantName}</strong>` : 'there'},<br>
          Thank you for signing up for RestoPOS Cloud. Please use the following 6-digit verification code to complete your registration:
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; background: #f1f5f9; border: 2px dashed #3b82f6; border-radius: 12px; padding: 18px 36px; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #1e3a8a;">
            ${otp}
          </div>
        </div>
        <p style="margin: 0 0 10px; font-size: 13px; color: #64748b; text-align: center;">
          This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.
        </p>
      </div>
      <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} RestoPOS Cloud Platform. All rights reserved.
      </div>
    </div>
  `;
    try {
        const tx = getTransporter();
        await tx.sendMail({
            from: `"${env.SMTP_FROM.split('@')[0] || 'RestoPOS SaaS'}" <${env.SMTP_FROM || env.SMTP_USER}>`,
            to: toEmail,
            subject: `[RestoPOS] Your Verification Code: ${otp}`,
            html,
        });
        return { success: true };
    }
    catch (error) {
        console.error('Failed to send OTP email via SMTP:', error);
        // Don't fail the user flow during development - return devOtp for testing fallback
        return { success: true, devOtp: otp };
    }
}
export async function sendApprovalEmail(toEmail, restaurantName, planName, loginUrl) {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
        console.log(`[EMAIL NOTICE] Approved notification for ${restaurantName} (${toEmail})`);
        return true;
    }
    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 800;">🎉 Restaurant Approved!</h1>
        <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Welcome to RestoPOS Cloud SaaS</p>
      </div>
      <div style="padding: 36px 32px; color: #1e293b;">
        <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">Congratulations, ${restaurantName}!</h2>
        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
          Your restaurant account and KYC verification have been <strong>approved</strong> by our platform administration team. Your subscription plan is now active.
        </p>
        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #065f46;"><strong>Plan:</strong> ${planName}</p>
          <p style="margin: 4px 0 0; font-size: 14px; color: #065f46;"><strong>Status:</strong> Active / Verified</p>
        </div>
        <div style="text-align: center; margin: 30px 0 10px;">
          <a href="${loginUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 10px rgba(16,185,129,0.3);">
            Log In to Your POS Dashboard &rarr;
          </a>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} RestoPOS Cloud Platform. All rights reserved.
      </div>
    </div>
  `;
    try {
        const tx = getTransporter();
        await tx.sendMail({
            from: `"${env.SMTP_FROM.split('@')[0] || 'RestoPOS SaaS'}" <${env.SMTP_FROM || env.SMTP_USER}>`,
            to: toEmail,
            subject: `🎉 Congratulations! Your restaurant "${restaurantName}" is Approved!`,
            html,
        });
        return true;
    }
    catch (error) {
        console.error('Failed to send approval email:', error);
        return false;
    }
}
export async function sendRejectionEmail(toEmail, restaurantName, reason) {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
        console.log(`[EMAIL NOTICE] Rejection notification for ${restaurantName} (${toEmail}) - Reason: ${reason}`);
        return true;
    }
    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 32px 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 800;">Application Update</h1>
        <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">RestoPOS Cloud Platform</p>
      </div>
      <div style="padding: 36px 32px; color: #1e293b;">
        <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #0f172a;">Application Status: Rejected</h2>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #475569;">
          Dear ${restaurantName},<br>
          Thank you for your interest in RestoPOS. Unfortunately, your registration could not be approved at this time.
        </p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Reason for Rejection:</strong></p>
          <p style="margin: 6px 0 0; font-size: 14px; color: #7f1d1d;">${reason}</p>
        </div>
        <p style="margin: 0 0 10px; font-size: 14px; color: #64748b;">
          Please feel free to contact our support team or register again with corrected documents.
        </p>
      </div>
    </div>
  `;
    try {
        const tx = getTransporter();
        await tx.sendMail({
            from: `"${env.SMTP_FROM.split('@')[0] || 'RestoPOS SaaS'}" <${env.SMTP_FROM || env.SMTP_USER}>`,
            to: toEmail,
            subject: `[RestoPOS] Update on your restaurant registration: "${restaurantName}"`,
            html,
        });
        return true;
    }
    catch (error) {
        console.error('Failed to send rejection email:', error);
        return false;
    }
}
//# sourceMappingURL=mail.js.map