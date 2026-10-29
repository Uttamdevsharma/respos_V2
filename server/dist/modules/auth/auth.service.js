import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
export class AuthService {
    static async login(input) {
        const { email, password } = input;
        // Find user with password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw ApiError.unauthorized('Invalid email or password');
        }
        if (!user.isActive) {
            throw ApiError.forbidden('Your account has been deactivated. Contact admin.');
        }
        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw ApiError.unauthorized('Invalid email or password');
        }
        // Generate JWT access token
        const token = jwt.sign({ id: user._id }, env.JWT_SECRET, {
            expiresIn: env.JWT_EXPIRES_IN,
        });
        // Generate refresh token and persist
        const refreshToken = jwt.sign({ id: user._id }, env.JWT_REFRESH_SECRET, {
            expiresIn: env.JWT_REFRESH_EXPIRES_IN,
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
            isActive: user.isActive,
        };
        return { user: userResponse, token, refreshToken };
    }
    static async getMe(userId) {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            throw ApiError.notFound('User not found');
        }
        return user;
    }
}
//# sourceMappingURL=auth.service.js.map