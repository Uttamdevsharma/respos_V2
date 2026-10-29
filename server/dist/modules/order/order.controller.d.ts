import { Request, Response } from 'express';
export declare class OrderController {
    static getAll: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static create: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getKitchenOrders: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getBillingOrders: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static processPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static addPartialPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static processSplitPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getWaiterOrders: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=order.controller.d.ts.map