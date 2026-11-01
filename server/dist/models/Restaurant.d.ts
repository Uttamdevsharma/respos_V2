import mongoose, { Document } from 'mongoose';
export type RestaurantStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';
export interface ITrialSession {
    session_id?: string;
    ip?: string;
    device?: string;
    start_time: Date;
    end_time?: Date;
    duration_seconds?: number;
    pages_visited?: string[];
}
export interface IBranchSubdoc {
    name: string;
    address: string;
    phone?: string;
    is_main?: boolean;
}
export interface IRestaurant extends Document {
    name: string;
    owner_name: string;
    email: string;
    contact_number: string;
    address: string;
    status: RestaurantStatus;
    plan_id: mongoose.Types.ObjectId;
    billing_cycle: BillingCycle;
    is_demo: boolean;
    demo_approved_at?: Date;
    demo_expires_at?: Date;
    drug_license_number?: string;
    drug_license_doc?: string;
    trade_license_number?: string;
    trade_license_doc?: string;
    nid_number?: string;
    nid_front_doc?: string;
    nid_back_doc?: string;
    payment_method?: string;
    payment_trx_id?: string;
    payment_amount?: number;
    payment_screenshot?: string;
    sender_number?: string;
    rejection_reason?: string;
    subscription_start?: Date;
    subscription_end?: Date;
    branches: IBranchSubdoc[];
    trial_sessions: ITrialSession[];
    createdAt: Date;
    updatedAt: Date;
}
declare const Restaurant: mongoose.Model<IRestaurant, {}, {}, {}, mongoose.Document<unknown, {}, IRestaurant, {}, {}> & IRestaurant & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Restaurant;
export { Restaurant as Business };
//# sourceMappingURL=Restaurant.d.ts.map