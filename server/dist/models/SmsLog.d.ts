import mongoose, { Document } from 'mongoose';
export type SmsDeliveryStatus = 'DELIVERED' | 'FAILED' | 'PENDING';
export type SmsCampaignType = 'BULK' | 'DUE_REMINDER' | 'CUSTOM' | 'EXPIRY_ALERT' | 'TEST';
export interface ISmsLog extends Document {
    recipient_phone: string;
    recipient_name?: string;
    restaurant_name?: string;
    restaurant_id?: mongoose.Types.ObjectId;
    message: string;
    char_count: number;
    sms_count: number;
    is_unicode: boolean;
    provider: string;
    sender_id?: string;
    status: SmsDeliveryStatus;
    gateway_response?: string;
    campaign_type: SmsCampaignType;
    createdAt: Date;
    updatedAt: Date;
}
declare const SmsLog: mongoose.Model<ISmsLog, {}, {}, {}, mongoose.Document<unknown, {}, ISmsLog, {}, {}> & ISmsLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default SmsLog;
//# sourceMappingURL=SmsLog.d.ts.map