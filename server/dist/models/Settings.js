import mongoose, { Schema } from 'mongoose';
const settingsSchema = new Schema({
    restaurantName: {
        type: String,
        default: 'GastroFlow Restaurant',
        trim: true,
    },
    address: {
        type: String,
        default: 'Dhaka, Bangladesh',
        trim: true,
    },
    phone: {
        type: String,
        default: '+880 1700-000000',
        trim: true,
    },
    taxRate: {
        type: Number,
        default: 15, // 15% VAT
        min: 0,
        max: 100,
    },
    serviceChargeRate: {
        type: Number,
        default: 5, // 5% Service Charge
        min: 0,
        max: 100,
    },
    currency: {
        type: String,
        default: '৳',
    },
}, {
    timestamps: true,
});
const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
//# sourceMappingURL=Settings.js.map