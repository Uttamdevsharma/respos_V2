import mongoose, { Document, Schema } from 'mongoose';

export type DemoLeadStatus = 'PENDING_CALL' | 'CALLED' | 'CONVERTED';

export interface IDemoLead extends Document {
  name: string;
  phone: string;
  email?: string;
  business_name?: string;
  message?: string;
  status: DemoLeadStatus;
  called_at?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const demoLeadSchema = new Schema<IDemoLead>(
  {
    name: {
      type: String,
      required: [true, 'Prospect name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    business_name: {
      type: String,
      trim: true,
      default: 'General Pharmacy Lead',
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING_CALL', 'CALLED', 'CONVERTED'],
      default: 'PENDING_CALL',
      index: true,
    },
    called_at: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const DemoLead = mongoose.model<IDemoLead>('DemoLead', demoLeadSchema);
export default DemoLead;
