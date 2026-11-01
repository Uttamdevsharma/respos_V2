import { Request, Response } from 'express';
export declare class SuperAdminController {
    static getOverview: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getPendingVerifications: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static approveRestaurant: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static rejectRestaurant: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getRestaurants: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getBusinessDetails: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateRestaurantStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getDemoAccounts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createDemoAccount: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateLeadStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getPlans: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createPlan: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updatePlan: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deletePlan: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=super-admin.controller.d.ts.map