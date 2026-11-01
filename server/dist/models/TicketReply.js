import mongoose, { Schema } from 'mongoose';
const attachmentSchema = new Schema({
    url: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number },
    type: { type: String },
}, { _id: false });
const ticketReplySchema = new Schema({
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
}, {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
ticketReplySchema.virtual('createdAt').get(function () {
    return this.created_at;
});
const TicketReply = mongoose.models.TicketReply ||
    mongoose.model('TicketReply', ticketReplySchema, 'ticket_replies');
export default TicketReply;
//# sourceMappingURL=TicketReply.js.map