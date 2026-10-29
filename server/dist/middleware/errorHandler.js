import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
export const errorHandler = (err, _req, res, _next) => {
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(env.NODE_ENV === 'development' && { stack: err.stack }),
        });
        return;
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            message: err.message,
        });
        return;
    }
    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        res.status(409).json({
            success: false,
            message: `Duplicate value for field: ${field}`,
        });
        return;
    }
    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400).json({
            success: false,
            message: 'Invalid ID format',
        });
        return;
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            message: 'Invalid token',
        });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            message: 'Token expired',
        });
        return;
    }
    // Default server error
    console.error('❌ Unhandled Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
//# sourceMappingURL=errorHandler.js.map