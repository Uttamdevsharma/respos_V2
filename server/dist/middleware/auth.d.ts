import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        _id: string;
        name: string;
        email: string;
        role: 'admin' | 'waiter' | 'cashier' | 'kitchen';
    };
}
export declare const protect: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map