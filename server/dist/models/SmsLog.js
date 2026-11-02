import mongoose, { Schema } from 'mongoose';
const smsLogSchema = new Schema({
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
}, {
    timestamps: true,
});
smsLogSchema.index({ createdAt: -1 });
const SmsLog = mongoose.model('SmsLog', smsLogSchema);
export default SmsLog;
//# sourceMappingURL=SmsLog.js.map