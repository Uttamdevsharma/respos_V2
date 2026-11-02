import PlatformSettings from '../../models/PlatformSettings.js';
import SmsLog from '../../models/SmsLog.js';
import Restaurant from '../../models/Restaurant.js';
import { ApiError } from '../../utils/ApiError.js';
import { replaceDynamicTags, sendPlatformSms } from './sms.service.js';
export class SmsController {
    // 1. Get SMS Gateway settings
    static async getSettings(_req, res) {
        const settings = await PlatformSettings.findOne();
        res.json({
            success: true,
            data: {
                sms_provider: settings?.sms_provider || 'GREENWEB',
                sms_gateway_url: settings?.sms_gateway_url || '',
                sms_api_key: settings?.sms_api_key || '',
                sms_sender_id: settings?.sms_sender_id || 'RestroBiz',
                sms_is_masking: Boolean(settings?.sms_is_masking),
                sms_masking_id: settings?.sms_masking_id || '',
                sms_non_masking_id: settings?.sms_non_masking_id || '',
            },
        });
    }
    // 2. Update SMS Gateway settings
    static async updateSettings(req, res) {
        const { sms_provider, sms_gateway_url, sms_api_key, sms_sender_id, sms_is_masking, sms_masking_id, sms_non_masking_id, } = req.body;
        const settings = await PlatformSettings.findOneAndUpdate({}, {
            $set: {
                sms_provider,
                sms_gateway_url,
                sms_api_key,
                sms_sender_id,
                sms_is_masking: Boolean(sms_is_masking),
                sms_masking_id,
                sms_non_masking_id,
            },
        }, { upsert: true, new: true });
        res.json({
            success: true,
            message: 'SMS Gateway settings updated successfully',
            data: {
                sms_provider: settings.sms_provider,
                sms_sender_id: settings.sms_sender_id,
                sms_is_masking: settings.sms_is_masking,
            },
        });
    }
    // 3. Test SMS delivery
    static async testSms(req, res) {
        const { phone, message } = req.body;
        if (!phone)
            throw ApiError.badRequest('Phone number is required');
        const msg = message || 'Test SMS from RestroBiz Cloud POS System. Gateway is connected!';
        const result = await sendPlatformSms(phone, msg, { campaign_type: 'TEST' });
        res.json({
            success: result.success,
            message: result.success ? 'Test SMS dispatched successfully' : 'SMS dispatch encountered gateway response error',
            response: result.gatewayResponse,
            log: result.log,
        });
    }
    // 4. Calculate Audience Count by target filter
    static async getAudienceCount(req, res) {
        const { target_type, custom_restaurant_ids } = req.query;
        const query = SmsController.buildAudienceQuery(String(target_type), custom_restaurant_ids);
        const count = await Restaurant.countDocuments(query);
        res.json({ success: true, count });
    }
    static buildAudienceQuery(targetType, customIds) {
        const now = new Date();
        const query = {};
        switch (targetType) {
            case 'ACTIVE':
                query.status = 'APPROVED';
                query.subscription_end = { $gt: now };
                break;
            case 'EXPIRED_DUE':
                query.$or = [
                    { status: 'SUSPENDED' },
                    { subscription_end: { $lte: now } },
                    { payment_amount: { $gt: 0 } },
                ];
                break;
            case 'DEMO_TRIAL':
                query.is_demo = true;
                break;
            case 'CUSTOM':
                if (customIds) {
                    const ids = Array.isArray(customIds) ? customIds : [customIds];
                    query._id = { $in: ids };
                }
                break;
            case 'ALL':
            default:
                // All non-rejected restaurants
                query.status = { $ne: 'REJECTED' };
                break;
        }
        return query;
    }
    // 5. Dispatch Bulk SMS Campaign
    static async dispatchCampaign(req, res) {
        const { target_type = 'ALL', custom_restaurant_ids, message_template, campaign_type = 'BULK' } = req.body;
        if (!message_template || !message_template.trim()) {
            throw ApiError.badRequest('Message content is required');
        }
        const query = SmsController.buildAudienceQuery(target_type, custom_restaurant_ids);
        const restaurants = await Restaurant.find(query);
        if (restaurants.length === 0) {
            throw ApiError.badRequest('No matching restaurants found for the selected target criteria');
        }
        const portalUrl = `${req.protocol}://${req.get('host')}`;
        let successCount = 0;
        let failedCount = 0;
        let totalUnits = 0;
        // Dispatch messages concurrently in chunks
        const chunkSize = 10;
        for (let i = 0; i < restaurants.length; i += chunkSize) {
            const chunk = restaurants.slice(i, i + chunkSize);
            await Promise.all(chunk.map(async (rest) => {
                const targetPhone = rest.contact_number || rest.sender_number;
                if (!targetPhone)
                    return;
                const personalizedMsg = replaceDynamicTags(message_template, rest, portalUrl);
                const result = await sendPlatformSms(targetPhone, personalizedMsg, {
                    restaurant: rest,
                    campaign_type,
                });
                if (result.success) {
                    successCount++;
                    totalUnits += result.log.sms_count;
                }
                else {
                    failedCount++;
                }
            }));
        }
        res.json({
            success: true,
            message: `SMS Campaign processed. Dispatched: ${successCount}, Failed: ${failedCount}, Total SMS Units: ${totalUnits}`,
            data: {
                total_recipients: restaurants.length,
                dispatched: successCount,
                failed: failedCount,
                total_sms_units: totalUnits,
            },
        });
    }
    // 6. Delivery Audit Logs with search & pagination
    static async getLogs(req, res) {
        const { search, status, campaign_type, page = 1, limit = 25 } = req.query;
        const query = {};
        if (status && status !== 'ALL') {
            query.status = status;
        }
        if (campaign_type && campaign_type !== 'ALL') {
            query.campaign_type = campaign_type;
        }
        if (search) {
            const reg = new RegExp(String(search), 'i');
            query.$or = [{ recipient_phone: reg }, { restaurant_name: reg }, { message: reg }];
        }
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;
        const [items, total] = await Promise.all([
            SmsLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            SmsLog.countDocuments(query),
        ]);
        res.json({
            success: true,
            data: {
                items,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    // 7. Get SMS Statistics
    static async getStats(_req, res) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalSent, totalFailed, totalUnitsResult, todaySent] = await Promise.all([
            SmsLog.countDocuments({ status: 'DELIVERED' }),
            SmsLog.countDocuments({ status: 'FAILED' }),
            SmsLog.aggregate([
                { $match: { status: 'DELIVERED' } },
                { $group: { _id: null, units: { $sum: '$sms_count' } } },
            ]),
            SmsLog.countDocuments({ status: 'DELIVERED', createdAt: { $gte: today } }),
        ]);
        const totalUnits = totalUnitsResult[0]?.units || 0;
        res.json({
            success: true,
            data: {
                total_delivered: totalSent,
                total_failed: totalFailed,
                total_sms_units: totalUnits,
                today_delivered: todaySent,
            },
        });
    }
}
//# sourceMappingURL=sms.controller.js.map