import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import User, { UserRole } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    restaurant_id?: string | null;
  };
}

export const protect = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw ApiError.unauthorized('Not authorized, no token provided');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated');
    }

    req.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      restaurant_id: user.restaurant_id ? user.restaurant_id.toString() : null,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized('Not authorized, token failed'));
    }
  }
};
