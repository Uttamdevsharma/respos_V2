import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
/**
 * Validates request body/query/params against a Zod schema.
 */
export declare const validate: (schema: ZodSchema, source?: "body" | "query" | "params") => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.d.ts.map