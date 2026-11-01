import mongoose, { Schema } from 'mongoose';
const subscriptionPlanSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Plan name is required'],
        trim: true,
        unique: true,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    badge: {
        type: String,
        trim: true,
        default: '',
    },
    monthly_price: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    annual_price: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    trial_days: {
        type: Number,
        default: 0,
        min: 0,
    },
    is_trial_tier: {
        type: Boolean,
        default: false,
    },
    is_custom_pricing: {
        type: Boolean,
        default: false,
    },
    contact_phone: {
        type: String,
        default: '01973590937',
    },
    max_tables: {
        type: Number,
        default: 10,
    },
    max_staff: {
        type: Number,
        default: 3,
    },
    max_branches: {
        type: Number,
        default: 1,
    },
    features: {
        type: [String],
        default: [],
    },
    is_popular: {
        type: Boolean,
        default: false,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
export default SubscriptionPlan;
//# sourceMappingURL=SubscriptionPlan.js.map