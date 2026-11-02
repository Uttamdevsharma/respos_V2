import { Request, Response } from 'express';
export declare class SmsController {
    static getSettings(_req: Request, res: Response): Promise<void>;
    static updateSettings(req: Request, res: Response): Promise<void>;
    static testSms(req: Request, res: Response): Promise<void>;
    static getAudienceCount(req: Request, res: Response): Promise<void>;
    private static buildAudienceQuery;
    static dispatchCampaign(req: Request, res: Response): Promise<void>;
    static getLogs(req: Request, res: Response): Promise<void>;
    static getStats(_req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=sms.controller.d.ts.map