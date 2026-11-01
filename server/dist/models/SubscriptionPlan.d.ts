import mongoose, { Document } from 'mongoose';
export interface ISubscriptionPlan extends Document {
    name: string;
    description: string;
    badge?: string;
    monthly_price: number;
    annual_price: number;
    trial_days: number;
    is_trial_tier: boolean;
    is_custom_pricing: boolean;
    contact_phone?: string;
    max_tables: number;
    max_staff: number;
    max_branches: number;
    features: string[];
    is_popular: boolean;
    is_active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const SubscriptionPlan: mongoose.Model<ISubscriptionPlan, {}, {}, {}, mongoose.Document<unknown, {}, ISubscriptionPlan, {}, {}> & ISubscriptionPlan & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default SubscriptionPlan;
//# sourceMappingURL=SubscriptionPlan.d.ts.map