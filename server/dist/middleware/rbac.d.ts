import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { UserRole } from '../models/User.js';
export type Role = UserRole;
/**
 * Role-Based Access Control middleware.
 * Restricts route access to specified roles.
 * Note: 'OWNER' is automatically authorized if 'admin' is in the allowed roles.
 */
export declare const authorize: (...roles: Role[]) => (req: AuthRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.d.ts.map