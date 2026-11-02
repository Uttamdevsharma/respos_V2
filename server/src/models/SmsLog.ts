import mongoose, { Document, Schema } from 'mongoose';

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

const smsLogSchema = new Schema<ISmsLog>(
  {
    recipient_phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    recipient_name: {
      type: String,
      trim: true,
    },
    restaurant_name: {
      type: String,
      trim: true,
    },
    restaurant_id: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    char_count: {
      type: Number,
      default: 0,
    },
    sms_count: {
      type: Number,
      default: 1,
    },
    is_unicode: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: String,
      default: 'GREENWEB',
      trim: true,
    },
    sender_id: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['DELIVERED', 'FAILED', 'PENDING'],
      default: 'DELIVERED',
      index: true,
    },
    gateway_response: {
      type: String,
    },
    campaign_type: {
      type: String,
      enum: ['BULK', 'DUE_REMINDER', 'CUSTOM', 'EXPIRY_ALERT', 'TEST'],
      default: 'BULK',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

smsLogSchema.index({ createdAt: -1 });

const SmsLog = mongoose.model<ISmsLog>('SmsLog', smsLogSchema);
export default SmsLog;

