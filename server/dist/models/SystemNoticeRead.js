import mongoose, { Schema } from 'mongoose';
const systemNoticeReadSchema = new Schema({
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
}, {
    timestamps: false,
});
// One read record per notice per restaurant tenant
systemNoticeReadSchema.index({ notice_id: 1, business_id: 1 }, { unique: true });
const SystemNoticeRead = mongoose.model('SystemNoticeRead', systemNoticeReadSchema);
export default SystemNoticeRead;
//# sourceMappingURL=SystemNoticeRead.js.map