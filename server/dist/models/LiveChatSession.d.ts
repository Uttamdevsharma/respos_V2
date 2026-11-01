import mongoose, { Document } from 'mongoose';
export type LiveChatDepartment = 'SALES' | 'TECH_SUPPORT' | 'BILLING' | 'GENERAL';
export type LiveChatStatus = 'WAITING' | 'ACTIVE' | 'RESOLVED' | 'CLOSED';
export interface ILiveChatSession extends Document {
    session_token: string;
    visitor_name: string;
    visitor_email: string;
    visitor_phone?: string;
    department: LiveChatDepartment;
    status: LiveChatStatus;
    current_url?: string;
    user_agent?: string;
    assigned_user_id?: mongoose.Types.ObjectId | null;
    last_message_at: Date;
    created_at: Date;
    updated_at: Date;
}
declare const LiveChatSession: mongoose.Model<any, {}, {}, {}, any, any>;
export default LiveChatSession;
//# sourceMappingURL=LiveChatSession.d.ts.map