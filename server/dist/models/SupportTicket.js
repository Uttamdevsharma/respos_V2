import mongoose, { Schema } from 'mongoose';
const attachmentSchema = new Schema({
    url: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number },
    type: { type: String },
}, { _id: false });
const supportTicketSchema = new Schema({
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
}, {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
supportTicketSchema.virtual('business_id').get(function () {
    return this.restaurant_id;
});
supportTicketSchema.virtual('createdAt').get(function () {
    return this.created_at;
});
supportTicketSchema.virtual('updatedAt').get(function () {
    return this.updated_at;
});
const SupportTicket = mongoose.models.SupportTicket ||
    mongoose.model('SupportTicket', supportTicketSchema, 'support_tickets');
export default SupportTicket;
//# sourceMappingURL=SupportTicket.js.map