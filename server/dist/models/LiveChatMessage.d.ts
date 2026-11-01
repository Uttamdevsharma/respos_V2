import mongoose, { Document } from 'mongoose';
export type LiveChatSenderType = 'VISITOR' | 'AGENT' | 'SYSTEM';
export interface ILiveChatMessageAttachment {
    url: string;
    name: string;
    size?: number;
    type?: string;
}
export interface ILiveChatMessage extends Document {
    session_id: mongoose.Types.ObjectId;
    sender_type: LiveChatSenderType;
    sender_name: string;
    message: string;
    attachments: ILiveChatMessageAttachment[];
    is_read: boolean;
    created_at: Date;
}
declare const LiveChatMessage: mongoose.Model<any, {}, {}, {}, any, any>;
export default LiveChatMessage;
//# sourceMappingURL=LiveChatMessage.d.ts.map