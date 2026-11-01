import mongoose, { Document, Schema } from 'mongoose';

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

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
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
  },
  {
    timestamps: true,
  }
);

const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);
export default SubscriptionPlan;
