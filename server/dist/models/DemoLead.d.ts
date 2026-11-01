import mongoose, { Document } from 'mongoose';
export type DemoLeadStatus = 'PENDING_CALL' | 'CALLED' | 'CONVERTED';
export interface IDemoLead extends Document {
    name: string;
    phone: string;
    email?: string;
    business_name?: string;
    message?: string;
    status: DemoLeadStatus;
    called_at?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const DemoLead: mongoose.Model<IDemoLead, {}, {}, {}, mongoose.Document<unknown, {}, IDemoLead, {}, {}> & IDemoLead & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default DemoLead;
//# sourceMappingURL=DemoLead.d.ts.map