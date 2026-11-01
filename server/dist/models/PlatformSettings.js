import mongoose, { Schema } from 'mongoose';
const platformSettingsSchema = new Schema({
    project_name: {
        type: String,
        default: 'Restobiz',
        trim: true,
    },
    logo_url: {
        type: String,
        default: '/images/restobiz-icon.png',
        trim: true,
    },
    login_image_url: {
        type: String,
        default: '',
        trim: true,
    },
    support_email: {
        type: String,
        default: 'support@restobiz.com',
        trim: true,
    },
    support_phone: {
        type: String,
        default: '01973590937',
        trim: true,
    },
    currency: {
        type: String,
        default: 'BDT',
        trim: true,
    },
    currency_symbol: {
        type: String,
        default: '৳',
        trim: true,
    },
    // 1. Manual Payment
    manual_payment_active: {
        type: Boolean,
        default: true,
    },
    bkash_number: {
        type: String,
        default: '01973590937',
        trim: true,
    },
    bkash_type: {
        type: String,
        default: 'Personal (Send Money)',
        trim: true,
    },
    nagad_number: {
        type: String,
        default: '01973590937',
        trim: true,
    },
    manual_payment_instruction: {
        type: String,
        default: 'Please send money to the official bKash/Nagad number above using "Send Money". Then copy your Transaction ID (TrxID) and submit below.',
        trim: true,
    },
    // 2. bKash Direct API
    bkash_merchant_active: {
        type: Boolean,
        default: false,
    },
    bkash_app_key: {
        type: String,
        default: '',
        trim: true,
    },
    bkash_app_secret: {
        type: String,
        default: '',
        trim: true,
    },
    bkash_username: {
        type: String,
        default: '',
        trim: true,
    },
    bkash_password: {
        type: String,
        default: '',
        trim: true,
    },
    bkash_is_sandbox: {
        type: Boolean,
        default: true,
    },
    // 3. Nagad Direct API
    nagad_merchant_active: {
        type: Boolean,
        default: false,
    },
    nagad_merchant_id: {
        type: String,
        default: '',
        trim: true,
    },
    nagad_public_key: {
        type: String,
        default: '',
        trim: true,
    },
    nagad_private_key: {
        type: String,
        default: '',
        trim: true,
    },
    nagad_is_sandbox: {
        type: Boolean,
        default: true,
    },
    // 4. SSLCommerz
    sslcommerz_active: {
        type: Boolean,
        default: false,
    },
    sslcommerz_store_id: {
        type: String,
        default: '',
        trim: true,
    },
    sslcommerz_store_passwd: {
        type: String,
        default: '',
        trim: true,
    },
    sslcommerz_is_sandbox: {
        type: Boolean,
        default: true,
    },
    // 5. Easy Payment System (EPS)
    eps_merchant_active: {
        type: Boolean,
        default: false,
    },
    eps_merchant_id: {
        type: String,
        default: '',
        trim: true,
    },
    eps_store_id: {
        type: String,
        default: '',
        trim: true,
    },
    eps_app_key: {
        type: String,
        default: '',
        trim: true,
    },
    eps_app_secret: {
        type: String,
        default: '',
        trim: true,
    },
    eps_is_sandbox: {
        type: Boolean,
        default: true,
    },
    youtube_url: {
        type: String,
        default: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        trim: true,
    },
}, {
    timestamps: true,
});
const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);
export default PlatformSettings;
//# sourceMappingURL=PlatformSettings.js.map