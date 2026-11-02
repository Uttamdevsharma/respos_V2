import mongoose, { Document, Schema } from 'mongoose';

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

const systemNoticeSchema = new Schema<ISystemNotice>(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
      maxlength: 255,
    },
    content: {
      type: String,
      required: [true, 'Notice content is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['ANNOUNCEMENT', 'URGENT', 'MAINTENANCE', 'UPDATE', 'FEATURE'],
      default: 'ANNOUNCEMENT',
    },
    badge_text: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    is_published: {
      type: Boolean,
      default: true,
      index: true,
    },
    show_banner: {
      type: Boolean,
      default: true,
    },
    banner_duration_days: {
      type: Number,
      default: 7,
    },
    banner_expires_at: {
      type: Date,
    },
    target_type: {
      type: String,
      enum: ['ALL', 'SPECIFIC'],
      default: 'ALL',
    },
    target_business_ids: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

systemNoticeSchema.index({ is_published: 1, pinned: -1, createdAt: -1 });

const SystemNotice = mongoose.model<ISystemNotice>('SystemNotice', systemNoticeSchema);
export default SystemNotice;

