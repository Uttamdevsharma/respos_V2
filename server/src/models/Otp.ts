import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
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
  },
  {
    timestamps: true,
  }
);

const Otp = mongoose.model<IOtp>('Otp', otpSchema);
export default Otp;
