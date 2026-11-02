import mongoose, { Document } from 'mongoose';
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
    software_columns: QuotationColumn[];
    software_rows: SoftwareRow[];
    software_amount: number;
    plan_name: string;
    billing_cycle: string;
    license_fee_title: string;
    license_fee_amount: number;
    subscription_amount: number;
    recurring_note?: string;
    has_hardware: boolean;
    hardware_columns: QuotationColumn[];
    hardware_rows: HardwareRow[];
    hardware_amount: number;
    grand_total: number;
    in_words?: string;
    project_breakdown?: string;
    terms_conditions?: string;
    client_requirements?: string;
    deliverables?: string;
    additional_notes?: string;
    company_signatory_name: string;
    company_signatory_title: string;
    company_phone: string;
    company_email: string;
    status: QuotationStatus;
    email_sent_at?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const PlatformQuotation: mongoose.Model<IPlatformQuotation, {}, {}, {}, mongoose.Document<unknown, {}, IPlatformQuotation, {}, {}> & IPlatformQuotation & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default PlatformQuotation;
//# sourceMappingURL=PlatformQuotation.d.ts.map