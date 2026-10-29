import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { AuthRequest } from '../../middleware/auth.js';
import User from '../../models/User.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

export class AuthController {
  static login = catchAsync(async (req: Request, res: Response) => {
    const { user, token, refreshToken } = await AuthService.login(req.body);
    // Set refresh token in HttpOnly cookie when possible
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

    // Return refresh token in body to allow client to store it (dev-friendly)
    const body: any = { user, token, refreshToken };
    ApiResponse.success(res, body, 'Login successful');
  });

  static getMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = await AuthService.getMe(req.user!._id);
    ApiResponse.success(res, user, 'User profile retrieved');
  });

  static logout = catchAsync(async (req: AuthRequest, res: Response) => {
    // Remove refresh token from DB and clear cookie
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    }
    res.clearCookie('gastroflow_refresh_token');
    ApiResponse.success(res, null, 'Logged out successfully');
  });

  static refresh = catchAsync(async (req: Request, res: Response) => {
    let token = req.cookies?.gastroflow_refresh_token;
    // For local development, also accept refresh token in request body
    if (!token && req.body?.refreshToken) token = req.body.refreshToken;
    if (!token) {
      throw ApiError.unauthorized('No refresh token');
    }

    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };
      const user = await AuthService.getMe(decoded.id as any);
      if (!user) throw ApiError.unauthorized('Invalid refresh token');

      // Load user from DB including refreshToken
      const UserModel = (await import('../../models/User.js')).default;
      const dbUser = await UserModel.findById(decoded.id).select('+refreshToken');
      if (!dbUser || dbUser.refreshToken !== token) {
        throw ApiError.unauthorized('Invalid refresh token');
      }

      // Issue new access token
      const newToken = jwt.sign({ id: dbUser._id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
      ApiResponse.success(res, { token: newToken }, 'Token refreshed');
    } catch (err) {
      throw ApiError.unauthorized('Refresh failed');
    }
  });
}
