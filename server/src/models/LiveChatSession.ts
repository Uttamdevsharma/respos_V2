import mongoose, { Document, Schema } from 'mongoose';

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

const liveChatSessionSchema = new Schema<ILiveChatSession>(
  {
    session_token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    visitor_name: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
    },
    visitor_email: {
      type: String,
      required: [true, 'Visitor email is required'],
      trim: true,
      lowercase: true,
    },
    visitor_phone: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      enum: ['SALES', 'TECH_SUPPORT', 'BILLING', 'GENERAL'],
      default: 'GENERAL',
      index: true,
    },
    status: {
      type: String,
      enum: ['WAITING', 'ACTIVE', 'RESOLVED', 'CLOSED'],
      default: 'WAITING',
      index: true,
    },
    current_url: {
      type: String,
      trim: true,
      default: '/',
    },
    user_agent: {
      type: String,
      trim: true,
      default: '',
    },
    assigned_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    last_message_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

liveChatSessionSchema.virtual('createdAt').get(function (this: any) {
  return this.created_at;
});
liveChatSessionSchema.virtual('updatedAt').get(function (this: any) {
  return this.updated_at;
});

const LiveChatSession =
  mongoose.models.LiveChatSession ||
  mongoose.model<ILiveChatSession>('LiveChatSession', liveChatSessionSchema, 'live_chat_sessions');

export default LiveChatSession;
