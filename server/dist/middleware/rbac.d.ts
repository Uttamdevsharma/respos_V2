import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
type Role = 'admin' | 'waiter' | 'cashier' | 'kitchen';
/**
 * Role-Based Access Control middleware.
 * Restricts route access to specified roles.
 */
export declare const authorize: (...roles: Role[]) => (req: AuthRequest, _res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=rbac.d.ts.map