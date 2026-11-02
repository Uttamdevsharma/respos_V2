import { Request, Response } from 'express';
export declare class PlatformStaffController {
    static getAll(_req: Request, res: Response): Promise<void>;
    static create(req: Request, res: Response): Promise<void>;
    static update(req: Request, res: Response): Promise<void>;
    static toggleActive(req: Request, res: Response): Promise<void>;
    static resetPassword(req: Request, res: Response): Promise<void>;
    static delete(req: Request, res: Response): Promise<void>;
    static getRoles(_req: Request, res: Response): Promise<void>;
    static createRole(req: Request, res: Response): Promise<void>;
    static updateRole(req: Request, res: Response): Promise<void>;
    static deleteRole(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=staff.controller.d.ts.map