import { ZodError } from 'zod';
/**
 * Validates request body/query/params against a Zod schema.
 */
export const validate = (schema, source = 'body') => {
    return (req, _res, next) => {
        try {
            const data = schema.parse(req[source]);
            req[source] = data;
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
                _res.status(400).json({
                    success: false,
                    message: `Validation error: ${messages}`,
                    errors: error.errors,
                });
                return;
            }
            next(error);
        }
    };
};
//# sourceMappingURL=validate.js.map