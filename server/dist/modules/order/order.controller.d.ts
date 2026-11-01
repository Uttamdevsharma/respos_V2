import { Response } from 'express';
export declare class OrderController {
    static getAll: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static create: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static updateStatus: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getKitchenOrders: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getBillingOrders: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static processPayment: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static addPartialPayment: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static processSplitPayment: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getWaiterOrders: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static addItems: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static cancelItem: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static delete: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static bulkDelete: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=order.controller.d.ts.map