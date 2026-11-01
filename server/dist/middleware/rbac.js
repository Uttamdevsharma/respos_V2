import { ApiError } from '../utils/ApiError.js';
/**
 * Role-Based Access Control middleware.
 * Restricts route access to specified roles.
 * Note: 'OWNER' is automatically authorized if 'admin' is in the allowed roles.
 */
export const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            next(ApiError.unauthorized('Not authenticated'));
            return;
        }
        const userRole = req.user.role;
        const isAllowed = roles.includes(userRole) ||
            (roles.includes('admin') && userRole === 'OWNER');
        if (!isAllowed) {
            next(ApiError.forbidden(`Role '${userRole}' is not authorized to access this resource`));
            return;
        }
        next();
    };
};
//# sourceMappingURL=rbac.js.map