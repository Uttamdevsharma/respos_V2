import mongoose, { Document } from 'mongoose';
export type NoticeType = 'ANNOUNCEMENT' | 'URGENT' | 'MAINTENANCE' | 'UPDATE' | 'FEATURE';
export type NoticeTargetType = 'ALL' | 'SPECIFIC';
export interface ISystemNotice extends Document {
    title: string;
    content: string;
    type: NoticeType;
    badge_text?: string;
    pinned: boolean;
    is_published: boolean;
    show_banner: boolean;
    banner_duration_days: number;
    banner_expires_at?: Date;
    target_type: NoticeTargetType;
    target_business_ids: string[];
    createdAt: Date;
    updatedAt: Date;
}
declare const SystemNotice: mongoose.Model<ISystemNotice, {}, {}, {}, mongoose.Document<unknown, {}, ISystemNotice, {}, {}> & ISystemNotice & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default SystemNotice;
//# sourceMappingURL=SystemNotice.d.ts.map