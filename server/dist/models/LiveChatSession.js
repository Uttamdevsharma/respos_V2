import mongoose, { Schema } from 'mongoose';
const liveChatSessionSchema = new Schema({
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
}, {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
liveChatSessionSchema.virtual('createdAt').get(function () {
    return this.created_at;
});
liveChatSessionSchema.virtual('updatedAt').get(function () {
    return this.updated_at;
});
const LiveChatSession = mongoose.models.LiveChatSession ||
    mongoose.model('LiveChatSession', liveChatSessionSchema, 'live_chat_sessions');
export default LiveChatSession;
//# sourceMappingURL=LiveChatSession.js.map