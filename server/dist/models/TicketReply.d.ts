import mongoose, { Document } from 'mongoose';
export type TicketSenderType = 'SUPER_ADMIN' | 'TENANT_USER';
export interface ITicketReplyAttachment {
    url: string;
    name: string;
    size?: number;
    type?: string;
}
export interface ITicketReply extends Document {
    ticket_id: mongoose.Types.ObjectId;
    sender_id: mongoose.Types.ObjectId;
    sender_type: TicketSenderType;
    message: string;
    attachments: ITicketReplyAttachment[];
    is_read: boolean;
    created_at: Date;
}
declare const TicketReply: mongoose.Model<any, {}, {}, {}, any, any>;
export default TicketReply;
//# sourceMappingURL=TicketReply.d.ts.map