import mongoose, { Schema } from 'mongoose';
const otpSchema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    otp: {
        type: String,
        required: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // MongoDB TTL auto-cleanup
    },
}, {
    timestamps: true,
});
const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
//# sourceMappingURL=Otp.js.map