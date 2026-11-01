import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
export declare const createTenantTicket: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getTenantTickets: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getTicketDetails: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const postTicketReply: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const uploadTicketAttachment: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAdminTicketStats: (_req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAdminTickets: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateAdminTicketStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getRestaurantsList: (_req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=supportTicket.controller.d.ts.map