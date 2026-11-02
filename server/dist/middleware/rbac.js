import { ApiError } from '../utils/ApiError.js';
const PLATFORM_ROLES = ['SUPER_ADMIN', 'CTO', 'PROJECT_MANAGER', 'SUPPORT_LEAD'];
const ADMIN_EQUIVALENTS = ['admin', 'OWNER', 'BRANCH_MANAGER'];
/**
 * Role-Based Access Control middleware.
 * Restricts route access to specified roles.
 * - If 'SUPER_ADMIN' is included in allowed roles, any platform staff role is authorized.
 * - If 'admin' is included in allowed roles, OWNER and BRANCH_MANAGER are also authorized.
 */
export const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            next(ApiError.unauthorized('Not authenticated'));
            return;
        }
        const userRole = req.user.role;
        const isPlatformAllowed = roles.includes('SUPER_ADMIN') && PLATFORM_ROLES.includes(userRole);
        const isAdminAllowed = roles.includes('admin') && ADMIN_EQUIVALENTS.includes(userRole);
        const isDirectlyAllowed = roles.includes(userRole);
        if (!isPlatformAllowed && !isAdminAllowed && !isDirectlyAllowed) {
            next(ApiError.forbidden(`Role '${userRole}' is not authorized to access this resource`));
            return;
        }
        next();
    };
};
//# sourceMappingURL=rbac.js.map