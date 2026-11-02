import mongoose, { Document, Schema } from 'mongoose';

export interface QuotationColumn {
  key: string;
  label: string;
  width?: string;
}

export interface SoftwareRow {
  sl: number | string;
  scope: string;
  particulars: string;
}

export interface HardwareRow {
  sl: number | string;
  product: string;
  specifications: string;
  amount: number | string;
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';

export interface IPlatformQuotation extends Document {
  ref_no: string;
  quote_date: Date;
  client_name: string;
  organization_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  subject: string;

  // Software Modules / Scope
  software_columns: QuotationColumn[];
  software_rows: SoftwareRow[];
  software_amount: number;
  plan_name: string;
  billing_cycle: string;
  license_fee_title: string;
  license_fee_amount: number;
  subscription_amount: number;
  recurring_note?: string;

  // Restaurant POS Hardware
  has_hardware: boolean;
  hardware_columns: QuotationColumn[];
  hardware_rows: HardwareRow[];
  hardware_amount: number;

  // Financial Totals
  grand_total: number;
  in_words?: string;

  // Rich Breakdown & Terms
  project_breakdown?: string;
  terms_conditions?: string;
  client_requirements?: string;
  deliverables?: string;
  additional_notes?: string;

  // Platform Signatory
  company_signatory_name: string;
  company_signatory_title: string;
  company_phone: string;
  company_email: string;

  status: QuotationStatus;
  email_sent_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const quotationColumnSchema = new Schema<QuotationColumn>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    width: { type: String },
  },
  { _id: false }
);

const softwareRowSchema = new Schema<SoftwareRow>(
  {
    sl: { type: Schema.Types.Mixed, required: true },
    scope: { type: String, required: true },
    particulars: { type: String, required: true },
  },
  { _id: false }
);

const hardwareRowSchema = new Schema<HardwareRow>(
  {
    sl: { type: Schema.Types.Mixed, required: true },
    product: { type: String, required: true },
    specifications: { type: String, required: true },
    amount: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const platformQuotationSchema = new Schema<IPlatformQuotation>(
  {
    ref_no: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    quote_date: {
      type: Date,
      default: Date.now,
    },
    client_name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    organization_name: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },

    // Software Scope
    software_columns: {
      type: [quotationColumnSchema],
      default: [],
    },
    software_rows: {
      type: [softwareRowSchema],
      default: [],
    },
    software_amount: {
      type: Number,
      default: 0,
    },
    plan_name: {
      type: String,
      default: 'Restaurant Growth Plan',
      trim: true,
    },
    billing_cycle: {
      type: String,
      default: 'MONTHLY',
      trim: true,
    },
    license_fee_title: {
      type: String,
      default: 'One-time Setup, Menu Indexing & Onboarding',
      trim: true,
    },
    license_fee_amount: {
      type: Number,
      default: 0,
    },
    subscription_amount: {
      type: Number,
      default: 0,
    },
    recurring_note: {
      type: String,
      trim: true,
    },

    // Hardware
    has_hardware: {
      type: Boolean,
      default: false,
    },
    hardware_columns: {
      type: [quotationColumnSchema],
      default: [],
    },
    hardware_rows: {
      type: [hardwareRowSchema],
      default: [],
    },
    hardware_amount: {
      type: Number,
      default: 0,
    },

    // Financial
    grand_total: {
      type: Number,
      default: 0,
    },
    in_words: {
      type: String,
      trim: true,
    },

    // Breakdown & Terms
    project_breakdown: {
      type: String,
    },
    terms_conditions: {
      type: String,
    },
    client_requirements: {
      type: String,
    },
    deliverables: {
      type: String,
    },
    additional_notes: {
      type: String,
    },

    // Platform Signatory
    company_signatory_name: {
      type: String,
      default: 'Md. Sorower Jahan',
      trim: true,
    },
    company_signatory_title: {
      type: String,
      default: 'CEO, RestroBiz SaaS',
      trim: true,
    },
    company_phone: {
      type: String,
      default: '+880 1973590937',
      trim: true,
    },
    company_email: {
      type: String,
      default: 'sales@restrobiz.com',
      trim: true,
    },

    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'],
      default: 'SENT',
      index: true,
    },
    email_sent_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const PlatformQuotation = mongoose.model<IPlatformQuotation>('PlatformQuotation', platformQuotationSchema);
export default PlatformQuotation;
