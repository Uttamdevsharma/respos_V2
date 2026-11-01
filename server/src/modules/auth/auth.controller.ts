import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { AuthRequest } from '../../middleware/auth.js';
import User from '../../models/User.js';
import Restaurant from '../../models/Restaurant.js';
import SubscriptionPlan from '../../models/SubscriptionPlan.js';
import Otp from '../../models/Otp.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { sendOtpEmail } from '../../utils/mail.js';
import { uploadFileSafe } from '../../utils/fileUpload.js';

export class AuthController {
  static login = catchAsync(async (req: Request, res: Response) => {
    const { user, token, refreshToken } = await AuthService.login(req.body);
    try {
      res.cookie('gastroflow_refresh_token', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      });
    } catch (e) {
      // ignore cookie set failures
    }

    const body: any = { user, token, refreshToken };
    ApiResponse.success(res, body, 'Login successful');
  });

  static getMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = await AuthService.getMe(req.user!._id);
    ApiResponse.success(res, user, 'User profile retrieved');
  });

  static logout = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    }
    res.clearCookie('gastroflow_refresh_token');
    ApiResponse.success(res, null, 'Logged out successfully');
  });

  static refresh = catchAsync(async (req: Request, res: Response) => {
    let token = req.cookies?.gastroflow_refresh_token;
    if (!token && req.body?.refreshToken) token = req.body.refreshToken;
    if (!token) {
      throw ApiError.unauthorized('No refresh token');
    }

    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };
      const user = await AuthService.getMe(decoded.id as any);
      if (!user) throw ApiError.unauthorized('Invalid refresh token');

      const UserModel = (await import('../../models/User.js')).default;
      const dbUser = await UserModel.findById(decoded.id).select('+refreshToken');
      if (!dbUser || dbUser.refreshToken !== token) {
        throw ApiError.unauthorized('Invalid refresh token');
      }

      const newToken = jwt.sign({ id: dbUser._id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
      ApiResponse.success(res, { token: newToken }, 'Token refreshed');
    } catch (err) {
      throw ApiError.unauthorized('Refresh failed');
    }
  });

  static sendOtp = catchAsync(async (req: Request, res: Response) => {
    const { email, restaurantName } = req.body;
    if (!email) throw ApiError.badRequest('Email is required');
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists. Please log in.');
    }
    const existingRest = await Restaurant.findOne({ email: normalizedEmail, status: { $ne: 'REJECTED' } });
    if (existingRest) {
      throw ApiError.conflict('A restaurant registration with this email already exists.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({
      email: normalizedEmail,
      otp,
      verified: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes TTL
    });

    const mailRes = await sendOtpEmail(normalizedEmail, otp, restaurantName);
    ApiResponse.success(res, {
      message: 'Verification code sent to your email address.',
      devOtp: mailRes.devOtp,
    }, 'OTP dispatched');
  });

  static verifyOtp = catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    if (!email || !otp) throw ApiError.badRequest('Email and 6-digit verification code are required');
    const normalizedEmail = email.toLowerCase().trim();

    const record = await Otp.findOne({
      email: normalizedEmail,
      otp: otp.trim(),
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      throw ApiError.badRequest('Invalid or expired verification code. Please request a new one.');
    }

    record.verified = true;
    await record.save();

    ApiResponse.success(res, { verified: true }, 'Email address verified successfully');
  });

  static registerRestaurant = catchAsync(async (req: Request, res: Response) => {
    const {
      restaurantName,
      businessName,
      ownerName,
      email,
      password,
      contactNumber,
      address,
      planId,
      billingCycle,
      isDemo,
      drugLicenseNumber,
      tradeLicenseNumber,
      nidNumber,
      paymentMethod,
      paymentTrxId,
      paymentAmount,
      senderNumber,
    } = req.body;

    const bName = restaurantName || businessName;
    if (!bName || !ownerName || !email || !password || !contactNumber) {
      throw ApiError.badRequest('Please fill in all required fields (business name, owner name, email, password, phone).');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP was passed
    const verifiedOtp = await Otp.findOne({ email: normalizedEmail, verified: true });
    if (!verifiedOtp) {
      throw ApiError.badRequest('Please verify your email address with OTP before submitting registration.');
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists.');
    }

    // Determine plan
    let targetPlanId = planId;
    if (!targetPlanId) {
      const trialPlan = await SubscriptionPlan.findOne({ is_trial_tier: true });
      targetPlanId = trialPlan?._id || (await SubscriptionPlan.findOne())?._id;
    }

    const isDemoBool = isDemo === true || isDemo === 'true';

    // Process files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    let drugLicenseDoc = req.body.drugLicenseDoc || '';
    let tradeLicenseDoc = req.body.tradeLicenseDoc || '';
    let nidFrontDoc = req.body.nidFrontDoc || '';
    let nidBackDoc = req.body.nidBackDoc || '';
    let paymentScreenshot = req.body.paymentScreenshot || '';

    if (files?.drugLicenseDoc?.[0]) drugLicenseDoc = await uploadFileSafe(files.drugLicenseDoc[0], 'kyc');
    if (files?.tradeLicenseDoc?.[0]) tradeLicenseDoc = await uploadFileSafe(files.tradeLicenseDoc[0], 'kyc');
    if (files?.nidFrontDoc?.[0]) nidFrontDoc = await uploadFileSafe(files.nidFrontDoc[0], 'kyc');
    if (files?.nidBackDoc?.[0]) nidBackDoc = await uploadFileSafe(files.nidBackDoc[0], 'kyc');
    if (files?.paymentScreenshot?.[0]) paymentScreenshot = await uploadFileSafe(files.paymentScreenshot[0], 'kyc');

    const now = new Date();
    const demoExpiresAt = new Date(now);
    demoExpiresAt.setDate(demoExpiresAt.getDate() + 14);

    const restaurant = await Restaurant.create({
      name: bName.trim(),
      owner_name: ownerName.trim(),
      email: normalizedEmail,
      contact_number: contactNumber.trim(),
      address: (address || 'Dhaka, Bangladesh').trim(),
      status: isDemoBool ? 'APPROVED' : 'PENDING',
      plan_id: targetPlanId,
      billing_cycle: billingCycle === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY',
      is_demo: isDemoBool,
      demo_approved_at: isDemoBool ? now : undefined,
      demo_expires_at: isDemoBool ? demoExpiresAt : undefined,
      drug_license_number: drugLicenseNumber?.trim() || '',
      drug_license_doc: drugLicenseDoc,
      trade_license_number: tradeLicenseNumber?.trim() || '',
      trade_license_doc: tradeLicenseDoc,
      nid_number: nidNumber?.trim() || '',
      nid_front_doc: nidFrontDoc,
      nid_back_doc: nidBackDoc,
      payment_method: isDemoBool ? 'FREE_TRIAL' : paymentMethod || 'MANUAL_BKASH',
      payment_trx_id: paymentTrxId?.trim() || '',
      payment_amount: Number(paymentAmount) || 0,
      payment_screenshot: paymentScreenshot,
      sender_number: senderNumber?.trim() || '',
      branches: [{ name: `${bName.trim()} (Main Outlet)`, address: (address || 'Dhaka').trim(), phone: contactNumber.trim(), is_main: true }],
      trial_sessions: isDemoBool
        ? [
            {
              session_id: 'sess_' + Math.random().toString(36).substring(2, 8),
              ip: req.ip || '103.145.23.12',
              device: req.headers['user-agent'] || 'Chrome (Desktop)',
              start_time: now,
              end_time: now,
              duration_seconds: 60,
              pages_visited: ['/pos', '/dashboard'],
            },
          ]
        : [],
    });

    const user = await User.create({
      name: ownerName.trim(),
      email: normalizedEmail,
      password,
      role: 'OWNER',
      phone: contactNumber.trim(),
      restaurant_id: restaurant._id,
      isActive: true,
    });

    // Clear OTP
    await Otp.deleteMany({ email: normalizedEmail });

    ApiResponse.created(res, {
      restaurantId: restaurant._id,
      userId: user._id,
      status: restaurant.status,
      isDemo: isDemoBool,
      message: isDemoBool
        ? 'Your 14-day Free Demo pharmacy account is activated! You can now log in.'
        : 'Your registration has been submitted and is pending Super Admin review.',
    }, isDemoBool ? 'Free Demo account created successfully' : 'Registration submitted for verification');
  });
}

