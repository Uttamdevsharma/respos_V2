import jwt from 'jsonwebtoken';
import User, { IUser } from '../../models/User.js';
import Restaurant from '../../models/Restaurant.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import { LoginInput } from './auth.validation.js';

export class AuthService {
  static async login(input: LoginInput): Promise<{ user: Partial<IUser> & { restaurant?: any }; token: string; refreshToken: string }> {
    const { email, password } = input;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    let restaurantData: any = null;

    // If user is not SUPER_ADMIN, check restaurant status
    if (user.role !== 'SUPER_ADMIN') {
      if (user.restaurant_id) {
        const restaurant = await Restaurant.findById(user.restaurant_id).populate('plan_id');
        if (!restaurant) {
          throw ApiError.forbidden('Associated restaurant not found.');
        }

        if (restaurant.status === 'PENDING') {
          throw ApiError.forbidden('Your restaurant registration is currently pending Super Admin approval. You will receive an email once approved.');
        }
        if (restaurant.status === 'REJECTED') {
          throw ApiError.forbidden(`Your restaurant application was rejected: ${restaurant.rejection_reason || 'Please contact support.'}`);
        }
        if (restaurant.status === 'SUSPENDED') {
          throw ApiError.forbidden('Your restaurant account has been suspended. Please contact platform administration.');
        }

        restaurantData = restaurant;
      }
    }

    // Generate JWT access token
    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    // Generate refresh token and persist
    const refreshToken = jwt.sign({ id: user._id }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });
    user.refreshToken = refreshToken;
    await user.save();

    // Return user without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      restaurant_id: user.restaurant_id,
      restaurant: restaurantData,
      isActive: user.isActive,
    };

    return { user: userResponse, token, refreshToken };
  }

  static async getMe(userId: string): Promise<Partial<IUser> & { restaurant?: any } | null> {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    let restaurantData: any = null;
    if (user.restaurant_id) {
      restaurantData = await Restaurant.findById(user.restaurant_id).populate('plan_id');
    }

    const userObj = user.toObject();
    return {
      ...userObj,
      restaurant: restaurantData,
    };
  }
}
