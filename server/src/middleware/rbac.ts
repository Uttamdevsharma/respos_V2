import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { ApiError } from '../utils/ApiError.js';

import { UserRole } from '../models/User.js';

export type Role = UserRole;

/**
 * Role-Based Access Control middleware.
 * Restricts route access to specified roles.
 * Note: 'OWNER' is automatically authorized if 'admin' is in the allowed roles.
 */
export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Not authenticated'));
      return;
    }

    const userRole = req.user.role;
    const isAllowed =
      roles.includes(userRole) ||
      (roles.includes('admin') && userRole === 'OWNER');

    if (!isAllowed) {
      next(ApiError.forbidden(`Role '${userRole}' is not authorized to access this resource`));
      return;
    }

    next();
  };
};
