import mongoose, { Document } from 'mongoose';
export interface IPlatformSettings extends Document {
    project_name: string;
    logo_url: string;
    login_image_url?: string;
    support_email: string;
    support_phone: string;
    currency: string;
    currency_symbol: string;
    manual_payment_active: boolean;
    bkash_number: string;
    bkash_type: string;
    nagad_number: string;
    manual_payment_instruction: string;
    bkash_merchant_active: boolean;
    bkash_app_key?: string;
    bkash_app_secret?: string;
    bkash_username?: string;
    bkash_password?: string;
    bkash_is_sandbox: boolean;
    nagad_merchant_active: boolean;
    nagad_merchant_id?: string;
    nagad_public_key?: string;
    nagad_private_key?: string;
    nagad_is_sandbox: boolean;
    sslcommerz_active: boolean;
    sslcommerz_store_id?: string;
    sslcommerz_store_passwd?: string;
    sslcommerz_is_sandbox: boolean;
    eps_merchant_active: boolean;
    eps_merchant_id?: string;
    eps_store_id?: string;
    eps_app_key?: string;
    eps_app_secret?: string;
    eps_is_sandbox: boolean;
    youtube_url: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const PlatformSettings: mongoose.Model<IPlatformSettings, {}, {}, {}, mongoose.Document<unknown, {}, IPlatformSettings, {}, {}> & IPlatformSettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default PlatformSettings;
//# sourceMappingURL=PlatformSettings.d.ts.map