/**
 * Wraps async route handlers to catch errors and pass them to error middleware.
 */
export const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
//# sourceMappingURL=catchAsync.js.map