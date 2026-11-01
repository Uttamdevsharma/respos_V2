import mongoose, { Document, Schema } from 'mongoose';

export type TicketCategory = 'BUG' | 'FEATURE' | 'QUERY';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'PENDING' | 'CHECKING' | 'WORKING' | 'TESTING' | 'SOLVED' | 'CLOSED';

export interface ITicketAttachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
}

export interface ISupportTicket extends Document {
  ticket_no: string;
  restaurant_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  subject: string;
  message: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  attachments: ITicketAttachment[];
  is_admin_read: boolean;
  created_at: Date;
  updated_at: Date;
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

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    ticket_no: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    restaurant_id: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['BUG', 'FEATURE', 'QUERY'],
      default: 'QUERY',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CHECKING', 'WORKING', 'TESTING', 'SOLVED', 'CLOSED'],
      default: 'PENDING',
      index: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    is_admin_read: {
      type: Boolean,
      default: false,
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

supportTicketSchema.virtual('business_id').get(function (this: any) {
  return this.restaurant_id;
});
supportTicketSchema.virtual('createdAt').get(function (this: any) {
  return this.created_at;
});
supportTicketSchema.virtual('updatedAt').get(function (this: any) {
  return this.updated_at;
});

const SupportTicket =
  mongoose.models.SupportTicket ||
  mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema, 'support_tickets');

export default SupportTicket;
