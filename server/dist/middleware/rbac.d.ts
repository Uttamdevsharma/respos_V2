import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { UserRole } from '../models/User.js';
export type Role = UserRole;
/**
 * Role-Based Access Control middleware.
 * Restricts route access to specified roles.
 * - If 'SUPER_ADMIN' is included in allowed roles, any platform staff role is authorized.
 * - If 'admin' is included in allowed roles, OWNER and BRANCH_MANAGER are also authorized.
 */
export declare const authorize: (...roles: Role[]) => (req: AuthRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.d.ts.map