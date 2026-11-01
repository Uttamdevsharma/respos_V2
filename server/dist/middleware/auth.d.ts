import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';
export interface AuthRequest extends Request {
    user?: {
        _id: string;
        name: string;
        email: string;
        role: UserRole;
        restaurant_id?: string | null;
    };
}
export declare const protect: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map