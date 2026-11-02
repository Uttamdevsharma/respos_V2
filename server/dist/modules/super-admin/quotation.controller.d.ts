import { Request, Response } from 'express';
export declare class QuotationController {
    private static generateRefNo;
    private static calculateTotals;
    static getAll(req: Request, res: Response): Promise<void>;
    static getNextRefNo(_req: Request, res: Response): Promise<void>;
    static getById(req: Request, res: Response): Promise<void>;
    static create(req: Request, res: Response): Promise<void>;
    static update(req: Request, res: Response): Promise<void>;
    static delete(req: Request, res: Response): Promise<void>;
    static updateStatus(req: Request, res: Response): Promise<void>;
    static sendEmail(req: Request, res: Response): Promise<void>;
    static getPublicQuotation(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=quotation.controller.d.ts.map