import PlatformQuotation from '../../models/PlatformQuotation.js';
import { ApiError } from '../../utils/ApiError.js';
import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
export class QuotationController {
    // Generate unique ref_no like RESTRO/2026/001
    static async generateRefNo() {
        const year = new Date().getFullYear();
        const count = await PlatformQuotation.countDocuments();
        const nextNum = (count + 1).toString().padStart(3, '0');
        let ref = `RESTRO/${year}/${nextNum}`;
        const exists = await PlatformQuotation.findOne({ ref_no: ref });
        if (exists) {
            ref = `RESTRO/${year}/${nextNum}-${Math.floor(100 + Math.random() * 900)}`;
        }
        return ref;
    }
    // Calculate grand total from license fee and hardware
    static calculateTotals(data) {
        const licenseFee = Number(data.license_fee_amount || 0);
        const hardwareAmount = data.has_hardware ? Number(data.hardware_amount || 0) : 0;
        const grandTotal = licenseFee + hardwareAmount;
        return {
            licenseFee,
            hardwareAmount,
            grandTotal,
        };
    }
    // 1. Get all quotations (with search, filter, pagination & metrics)
    static async getAll(req, res) {
        const { search, status, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status && status !== 'ALL') {
            query.status = status;
        }
        if (search) {
            const searchRegex = new RegExp(String(search), 'i');
            query.$or = [
                { ref_no: searchRegex },
                { client_name: searchRegex },
                { organization_name: searchRegex },
                { email: searchRegex },
                { phone: searchRegex },
                { subject: searchRegex },
            ];
        }
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;
        const [items, total, stats] = await Promise.all([
            PlatformQuotation.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            PlatformQuotation.countDocuments(query),
            PlatformQuotation.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$grand_total' },
                    },
                },
            ]),
        ]);
        const statMap = {
            TOTAL: { count: 0, amount: 0 },
            DRAFT: { count: 0, amount: 0 },
            SENT: { count: 0, amount: 0 },
            ACCEPTED: { count: 0, amount: 0 },
            REJECTED: { count: 0, amount: 0 },
        };
        stats.forEach((s) => {
            if (statMap[s._id]) {
                statMap[s._id] = { count: s.count, amount: s.totalAmount || 0 };
            }
            statMap.TOTAL.count += s.count;
            statMap.TOTAL.amount += s.totalAmount || 0;
        });
        const nextRefNo = await QuotationController.generateRefNo();
        res.json({
            success: true,
            nextRefNo,
            data: {
                items,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum),
                stats: statMap,
                nextRefNo,
            },
        });
    }
    // 1.1 Get Next Quotation Ref No
    static async getNextRefNo(_req, res) {
        const nextRefNo = await QuotationController.generateRefNo();
        res.json({ success: true, nextRefNo, data: { nextRefNo } });
    }
    // 2. Get quotation by ID or ref_no
    static async getById(req, res) {
        const { id } = req.params;
        let quote = await PlatformQuotation.findById(id);
        if (!quote) {
            quote = await PlatformQuotation.findOne({ ref_no: id });
        }
        if (!quote) {
            throw ApiError.notFound('Quotation not found');
        }
        res.json({ success: true, data: quote });
    }
    // 3. Create quotation
    static async create(req, res) {
        const data = req.body;
        if (!data.ref_no || !data.ref_no.trim()) {
            data.ref_no = await QuotationController.generateRefNo();
        }
        const { licenseFee, hardwareAmount, grandTotal } = QuotationController.calculateTotals(data);
        data.license_fee_amount = licenseFee;
        data.hardware_amount = hardwareAmount;
        data.grand_total = data.grand_total ? Number(data.grand_total) : grandTotal;
        const quotation = await PlatformQuotation.create(data);
        res.status(201).json({ success: true, data: quotation });
    }
    // 4. Update quotation
    static async update(req, res) {
        const { id } = req.params;
        const data = req.body;
        const { licenseFee, hardwareAmount, grandTotal } = QuotationController.calculateTotals(data);
        data.license_fee_amount = licenseFee;
        data.hardware_amount = hardwareAmount;
        if (!data.grand_total) {
            data.grand_total = grandTotal;
        }
        const quotation = await PlatformQuotation.findByIdAndUpdate(id, data, { new: true });
        if (!quotation) {
            throw ApiError.notFound('Quotation not found');
        }
        res.json({ success: true, data: quotation });
    }
    // 5. Delete quotation
    static async delete(req, res) {
        const { id } = req.params;
        const quotation = await PlatformQuotation.findByIdAndDelete(id);
        if (!quotation) {
            throw ApiError.notFound('Quotation not found');
        }
        res.json({ success: true, message: 'Quotation deleted successfully' });
    }
    // 6. Update Status (DRAFT, SENT, ACCEPTED, REJECTED)
    static async updateStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        if (!['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'].includes(status)) {
            throw ApiError.badRequest('Invalid quotation status');
        }
        const quotation = await PlatformQuotation.findByIdAndUpdate(id, { status }, { new: true });
        if (!quotation) {
            throw ApiError.notFound('Quotation not found');
        }
        res.json({ success: true, data: quotation });
    }
    // 7. Dispatch proposal via Email to Client
    static async sendEmail(req, res) {
        const { id } = req.params;
        const { recipient_email } = req.body;
        const quote = await PlatformQuotation.findById(id);
        if (!quote)
            throw ApiError.notFound('Quotation not found');
        const targetEmail = recipient_email || quote.email;
        if (!targetEmail) {
            throw ApiError.badRequest('No recipient email specified for this quotation');
        }
        // Try sending email if SMTP settings or nodemailer is available
        let emailSent = false;
        let emailMessage = '';
        try {
            if (env.SMTP_USER && env.SMTP_PASS) {
                const transporter = nodemailer.createTransport({
                    host: env.SMTP_HOST || 'smtp.gmail.com',
                    port: Number(env.SMTP_PORT) || 587,
                    secure: Number(env.SMTP_PORT) === 465,
                    auth: {
                        user: env.SMTP_USER,
                        pass: env.SMTP_PASS,
                    },
                });
                const quoteUrl = `${req.protocol}://${req.get('host')}/quote/${quote._id}`;
                await transporter.sendMail({
                    from: `"${quote.company_signatory_name || 'RestroBiz'}" <${env.SMTP_USER}>`,
                    to: targetEmail,
                    subject: `Quotation & Proposal: ${quote.subject} (${quote.ref_no})`,
                    html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #059669; margin-top: 0;">RestroBiz Smart Restaurant Solution</h2>
              <p>Dear <strong>${quote.client_name}</strong>,</p>
              <p>Thank you for considering RestroBiz for <strong>${quote.organization_name || 'your restaurant'}</strong>. Please find the official proposal details below:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
                <tr><td style="padding: 6px 0; color: #64748b;">Reference No:</td><td style="font-weight: bold;">${quote.ref_no}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">Subject:</td><td style="font-weight: bold;">${quote.subject}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">Package:</td><td style="font-weight: bold;">${quote.plan_name}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">Total Onboarding:</td><td style="font-weight: bold; color: #059669;">৳ ${quote.grand_total.toLocaleString()}</td></tr>
              </table>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${quoteUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  View & Print Official Quotation
                </a>
              </div>
              <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                If you have any questions, feel free to reply to this email or call us at ${quote.company_phone || '+880 1973590937'}.
              </p>
            </div>
          `,
                });
                emailSent = true;
                emailMessage = 'Quotation proposal dispatched successfully via SMTP';
            }
            else {
                emailSent = true;
                emailMessage = 'Mock SMTP: Proposal recorded as sent (Configure SMTP_USER in .env for live email delivery)';
            }
        }
        catch (err) {
            emailSent = false;
            emailMessage = `Failed to deliver email: ${err.message}`;
        }
        quote.status = 'SENT';
        quote.email_sent_at = new Date();
        await quote.save();
        res.json({
            success: emailSent,
            message: emailMessage,
            data: quote,
        });
    }
    // 8. Public view (for client /quote/:id)
    static async getPublicQuotation(req, res) {
        const { id } = req.params;
        let quote = await PlatformQuotation.findById(id);
        if (!quote) {
            quote = await PlatformQuotation.findOne({ ref_no: id });
        }
        if (!quote) {
            throw ApiError.notFound('Quotation not found');
        }
        res.json({ success: true, data: quote });
    }
}
//# sourceMappingURL=quotation.controller.js.map