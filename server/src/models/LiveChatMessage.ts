import mongoose, { Document, Schema } from 'mongoose';

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

const attachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number },
    type: { type: String },
  },
  { _id: false }
);

const liveChatMessageSchema = new Schema<ILiveChatMessage>(
  {
    session_id: {
      type: Schema.Types.ObjectId,
      ref: 'LiveChatSession',
      required: true,
      index: true,
    },
    sender_type: {
      type: String,
      enum: ['VISITOR', 'AGENT', 'SYSTEM'],
      required: true,
    },
    sender_name: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

liveChatMessageSchema.virtual('createdAt').get(function (this: any) {
  return this.created_at;
});

const LiveChatMessage =
  mongoose.models.LiveChatMessage ||
  mongoose.model<ILiveChatMessage>('LiveChatMessage', liveChatMessageSchema, 'live_chat_messages');

export default LiveChatMessage;
