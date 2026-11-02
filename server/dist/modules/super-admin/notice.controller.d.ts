import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
export declare class NoticeController {
    static getAll(req: Request, res: Response): Promise<void>;
    static create(req: Request, res: Response): Promise<void>;
    static update(req: Request, res: Response): Promise<void>;
    static delete(req: Request, res: Response): Promise<void>;
    static toggleField(req: Request, res: Response): Promise<void>;
    static getTenantNotices(req: AuthRequest, res: Response): Promise<void>;
    static markNoticeRead(req: AuthRequest, res: Response): Promise<void>;
    static markAllRead(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=notice.controller.d.ts.map