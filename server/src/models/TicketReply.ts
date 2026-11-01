import mongoose, { Document, Schema } from 'mongoose';

export type TicketSenderType = 'SUPER_ADMIN' | 'TENANT_USER';

export interface ITicketReplyAttachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
}

export interface ITicketReply extends Document {
  ticket_id: mongoose.Types.ObjectId;
  sender_id: mongoose.Types.ObjectId;
  sender_type: TicketSenderType;
  message: string;
  attachments: ITicketReplyAttachment[];
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

const ticketReplySchema = new Schema<ITicketReply>(
  {
    ticket_id: {
      type: Schema.Types.ObjectId,
      ref: 'SupportTicket',
      required: true,
      index: true,
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender_type: {
      type: String,
      enum: ['SUPER_ADMIN', 'TENANT_USER'],
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Reply message is required'],
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

ticketReplySchema.virtual('createdAt').get(function (this: any) {
  return this.created_at;
});

const TicketReply =
  mongoose.models.TicketReply ||
  mongoose.model<ITicketReply>('TicketReply', ticketReplySchema, 'ticket_replies');

export default TicketReply;
