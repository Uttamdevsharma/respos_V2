import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  restaurant_id: mongoose.Types.ObjectId;
  restaurantName: string;
  address: string;
  phone: string;
  taxRate: number;
  serviceChargeRate: number;
  currency: string;
  logo?: string;
  loginImage?: string;
  brandColor?: string;    // hex color e.g. "#1a3c5e"
  tagline?: string;       // e.g. "Restaurant POS System"
  description?: string;  // e.g. "Professional restaurant management..."
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    restaurant_id: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
      unique: true,
    },
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
      default: 15,
      min: 0,
      max: 100,
    },
    serviceChargeRate: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },
    currency: {
      type: String,
      default: '৳',
    },
    logo: {
      type: String,
      default: null,
    },
    loginImage: {
      type: String,
      default: null,
    },
    brandColor: {
      type: String,
      default: '#1a3c5e',
    },
    tagline: {
      type: String,
      default: 'Restaurant POS System',
      trim: true,
    },
    description: {
      type: String,
      default: 'Professional restaurant management for modern Bangladeshi restaurants. Manage orders, kitchen, billing, and more — all in one place.',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
export default Settings;
