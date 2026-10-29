import { ApiError } from '../utils/ApiError.js';
/**
 * Role-Based Access Control middleware.
 * Restricts route access to specified roles.
 */
export const authorize = (...roles) => {
    return (req, _res, next) => {
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
//# sourceMappingURL=rbac.js.map