import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { ApiError } from '../utils/ApiError.js';
import { UserRole } from '../models/User.js';

export type Role = UserRole;

const PLATFORM_ROLES: UserRole[] = ['SUPER_ADMIN', 'CTO', 'PROJECT_MANAGER', 'SUPPORT_LEAD'];
const ADMIN_EQUIVALENTS: UserRole[] = ['admin', 'OWNER', 'BRANCH_MANAGER'];

/**
 * Role-Based Access Control middleware.
 * Restricts route access to specified roles.
 * - If 'SUPER_ADMIN' is included in allowed roles, any platform staff role is authorized.
 * - If 'admin' is included in allowed roles, OWNER and BRANCH_MANAGER are also authorized.
 */
export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Not authenticated'));
      return;
    }

    const userRole = req.user.role;

    const isPlatformAllowed =
      roles.includes('SUPER_ADMIN') && PLATFORM_ROLES.includes(userRole);

    const isAdminAllowed =
      roles.includes('admin') && ADMIN_EQUIVALENTS.includes(userRole);

    const isDirectlyAllowed = roles.includes(userRole);

    if (!isPlatformAllowed && !isAdminAllowed && !isDirectlyAllowed) {
      next(ApiError.forbidden(`Role '${userRole}' is not authorized to access this resource`));
      return;
    }

    next();
  };
};
