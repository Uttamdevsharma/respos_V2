import PlatformSettings from '../../models/PlatformSettings.js';
import SubscriptionPlan from '../../models/SubscriptionPlan.js';
import DemoLead from '../../models/DemoLead.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
export class PublicController {
    static getPlatformSettings = catchAsync(async (_req, res) => {
        let settings = await PlatformSettings.findOne();
        if (!settings) {
            settings = await PlatformSettings.create({});
        }
        // Expose only non-secret gateway flags and public info
        const safeSettings = {
            project_name: settings.project_name,
            logo_url: settings.logo_url,
            login_image_url: settings.login_image_url,
            support_email: settings.support_email,
            support_phone: settings.support_phone,
            currency: settings.currency,
            currency_symbol: settings.currency_symbol,
            youtube_url: settings.youtube_url,
            // Payment toggles & public numbers
            manual_payment_active: settings.manual_payment_active,
            bkash_number: settings.bkash_number,
            bkash_type: settings.bkash_type,
            nagad_number: settings.nagad_number,
            manual_payment_instruction: settings.manual_payment_instruction,
            bkash_merchant_active: settings.bkash_merchant_active,
            nagad_merchant_active: settings.nagad_merchant_active,
            sslcommerz_active: settings.sslcommerz_active,
            eps_merchant_active: settings.eps_merchant_active,
        };
        ApiResponse.success(res, safeSettings, 'Platform settings retrieved');
    });
    static getPlans = catchAsync(async (_req, res) => {
        const plans = await SubscriptionPlan.find({ is_active: true }).sort({ monthly_price: 1 });
        ApiResponse.success(res, plans, 'Active subscription plans retrieved');
    });
    static contact = catchAsync(async (req, res) => {
        const { name, email, phone, pharmacy_name, business_name, message } = req.body;
        const lead = await DemoLead.create({
            name: name || 'Interested Prospect',
            phone: phone || '',
            email: email || '',
            business_name: pharmacy_name || business_name || 'Prospect Pharmacy',
            message: message || 'Submitted inquiry from landing page.',
            status: 'PENDING_CALL',
        });
        console.log(`[DEMO LEAD SAVED] ID: ${lead._id} - ${lead.name} (${lead.phone})`);
        ApiResponse.success(res, lead, 'Thank you! Your inquiry and demo request have been received.');
    });
}
//# sourceMappingURL=public.controller.js.map