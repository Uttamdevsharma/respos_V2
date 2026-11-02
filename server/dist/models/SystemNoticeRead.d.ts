import mongoose, { Document } from 'mongoose';
export interface ISystemNoticeRead extends Document {
    notice_id: mongoose.Types.ObjectId;
    business_id: string;
    user_id?: string;
    read_at: Date;
}
declare const SystemNoticeRead: mongoose.Model<ISystemNoticeRead, {}, {}, {}, mongoose.Document<unknown, {}, ISystemNoticeRead, {}, {}> & ISystemNoticeRead & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default SystemNoticeRead;
//# sourceMappingURL=SystemNoticeRead.d.ts.map