import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
export declare const createVisitorSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getVisitorSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const postVisitorMessage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const endVisitorSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getLiveChatStats: (_req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAdminSessions: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAdminSessionDetails: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const postAdminMessage: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateAdminSessionStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=liveChat.controller.d.ts.map