import { Response } from 'express';
export declare class SettingsController {
    static get: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static update: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    /** Handle logo and loginImage uploads (multipart/form-data) */
    static uploadImages: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=settings.controller.d.ts.map