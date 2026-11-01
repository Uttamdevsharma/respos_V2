import mongoose, { Schema } from 'mongoose';
const trialSessionSchema = new Schema({
    session_id: { type: String, default: () => Math.random().toString(36).substring(2, 10) },
    ip: { type: String, default: '103.145.23.12' },
    device: { type: String, default: 'Chrome 122 (Windows 11)' },
    start_time: { type: Date, default: Date.now },
    end_time: { type: Date },
    duration_seconds: { type: Number, default: 0 },
    pages_visited: { type: [String], default: ['/pos', '/medicines', '/inventory', '/reports'] },
}, { _id: false });
const branchSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    is_main: { type: Boolean, default: false },
}, { _id: true });
const restaurantSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Pharmacy / Business name is required'],
        trim: true,
    },
    owner_name: {
        type: String,
        required: [true, 'Owner name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    contact_number: {
        type: String,
        required: [true, 'Contact number is required'],
        trim: true,
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
        default: 'PENDING',
        index: true,
    },
    plan_id: {
        type: Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: [true, 'Subscription plan is required'],
    },
    billing_cycle: {
        type: String,
        enum: ['MONTHLY', 'ANNUAL'],
        default: 'MONTHLY',
    },
    is_demo: {
        type: Boolean,
        default: false,
        index: true,
    },
    demo_approved_at: {
        type: Date,
    },
    demo_expires_at: {
        type: Date,
        index: true,
    },
    drug_license_number: {
        type: String,
        trim: true,
    },
    drug_license_doc: {
        type: String,
        trim: true,
    },
    trade_license_number: {
        type: String,
        trim: true,
    },
    trade_license_doc: {
        type: String,
        trim: true,
    },
    nid_number: {
        type: String,
        trim: true,
    },
    nid_front_doc: {
        type: String,
        trim: true,
    },
    nid_back_doc: {
        type: String,
        trim: true,
    },
    payment_method: {
        type: String,
        trim: true,
        default: 'FREE_TRIAL',
    },
    payment_trx_id: {
        type: String,
        trim: true,
    },
    payment_amount: {
        type: Number,
        default: 0,
    },
    payment_screenshot: {
        type: String,
        trim: true,
    },
    sender_number: {
        type: String,
        trim: true,
    },
    rejection_reason: {
        type: String,
        trim: true,
    },
    subscription_start: {
        type: Date,
    },
    subscription_end: {
        type: Date,
    },
    branches: {
        type: [branchSchema],
        default: [],
    },
    trial_sessions: {
        type: [trialSessionSchema],
        default: [],
    },
}, {
    timestamps: true,
});
const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;
export { Restaurant as Business };
//# sourceMappingURL=Restaurant.js.map