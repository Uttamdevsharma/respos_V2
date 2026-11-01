import mongoose, { Document } from 'mongoose';
export type TicketCategory = 'BUG' | 'FEATURE' | 'QUERY';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'PENDING' | 'CHECKING' | 'WORKING' | 'TESTING' | 'SOLVED' | 'CLOSED';
export interface ITicketAttachment {
    url: string;
    name: string;
    size?: number;
    type?: string;
}
export interface ISupportTicket extends Document {
    ticket_no: string;
    restaurant_id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    subject: string;
    message: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    attachments: ITicketAttachment[];
    is_admin_read: boolean;
    created_at: Date;
    updated_at: Date;
}
declare const SupportTicket: mongoose.Model<any, {}, {}, {}, any, any>;
export default SupportTicket;
//# sourceMappingURL=SupportTicket.d.ts.map