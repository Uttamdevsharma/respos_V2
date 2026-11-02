import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemNoticeRead extends Document {
  notice_id: mongoose.Types.ObjectId;
  business_id: string; // Restaurant tenant ID
  user_id?: string;
  read_at: Date;
}

const systemNoticeReadSchema = new Schema<ISystemNoticeRead>(
  {
    notice_id: {
      type: Schema.Types.ObjectId,
      ref: 'SystemNotice',
      required: true,
      index: true,
    },
    business_id: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    user_id: {
      type: String,
      trim: true,
    },
    read_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// One read record per notice per restaurant tenant
systemNoticeReadSchema.index({ notice_id: 1, business_id: 1 }, { unique: true });

const SystemNoticeRead = mongoose.model<ISystemNoticeRead>('SystemNoticeRead', systemNoticeReadSchema);
export default SystemNoticeRead;

