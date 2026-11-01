import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import User from '../models/User.js';
export const protect = async (req, _res, next) => {
    try {
        let token;
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            throw ApiError.unauthorized('Not authorized, no token provided');
        }
        const decoded = jwt.verify(token, env.JWT_SECRET);
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
    }
    catch (error) {
        if (error instanceof ApiError) {
            next(error);
        }
        else {
            next(ApiError.unauthorized('Not authorized, token failed'));
        }
    }
};
//# sourceMappingURL=auth.js.map