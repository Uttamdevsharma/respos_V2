import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { ApiError } from '../utils/ApiError.js';

type Role = 'admin' | 'waiter' | 'cashier' | 'kitchen';

/**
 * Role-Based Access Control middleware.
 * Restricts route access to specified roles.
 */
export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Not authenticated'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden(`Role '${req.user.role}' is not authorized to access this resource`));
      return;
    }

    next();
  };
};
