import PlatformSettings from '../../models/PlatformSettings.js';
import SmsLog from '../../models/SmsLog.js';
// 1. Calculate SMS characters and unit breakdown
export function calculateSmsUnits(text) {
    const content = text || '';
    const charCount = content.length;
    // Unicode check (Bengali / Non-ASCII)
    const isUnicode = /[^\u0000-\u007f]/.test(content);
    let smsCount = 1;
    if (charCount === 0) {
        smsCount = 0;
    }
    else if (isUnicode) {
        if (charCount > 70) {
            smsCount = Math.ceil(charCount / 67);
        }
    }
    else {
        if (charCount > 160) {
            smsCount = Math.ceil(charCount / 153);
        }
    }
    return {
        smsCount: Math.max(1, smsCount),
        isUnicode,
        charCount,
    };
}
// 2. Format phone to Bangladesh standard (8801XXXXXXXXX)
export function formatBdPhone(phone) {
    let cleaned = (phone || '').replace(/[^0-9]/g, '');
    if (cleaned.startsWith('880'))
        return cleaned;
    if (cleaned.startsWith('0'))
        return '88' + cleaned;
    if (cleaned.length === 10)
        return '880' + cleaned;
    return cleaned;
}
// 3. Dispatch an individual SMS through configured Gateway
export async function sendPlatformSms(toPhone, message, options) {
    const settings = await PlatformSettings.findOne();
    const phone = formatBdPhone(toPhone);
    const units = calculateSmsUnits(message);
    const provider = settings?.sms_provider || 'GREENWEB';
    const apiKey = settings?.sms_api_key || '';
    const senderId = settings?.sms_is_masking
        ? settings?.sms_masking_id || settings?.sms_sender_id
        : settings?.sms_non_masking_id || settings?.sms_sender_id || 'RestroBiz';
    let status = 'DELIVERED';
    let gatewayResponse = '';
    // If no API key configured, run in Mock / Demo Dispatch mode
    if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_API_KEY') {
        status = 'DELIVERED';
        gatewayResponse = `MOCK_SUCCESS: Simulated delivery via ${provider} to ${phone} (Set SMS_API_KEY for live sending)`;
    }
    else {
        try {
            if (provider === 'GREENWEB') {
                const params = new URLSearchParams();
                params.append('token', apiKey);
                params.append('to', phone);
                params.append('message', message);
                if (senderId)
                    params.append('senderid', senderId);
                const res = await fetch('https://api.greenweb.com.bd/api.php', {
                    method: 'POST',
                    body: params,
                });
                const text = await res.text();
                gatewayResponse = text;
                const isOk = !text.toLowerCase().includes('error');
                status = isOk ? 'DELIVERED' : 'FAILED';
            }
            else if (provider === 'MIM_SMS') {
                const params = new URLSearchParams();
                params.append('api_key', apiKey);
                params.append('type', units.isUnicode ? 'unicode' : 'text');
                params.append('contacts', phone);
                if (senderId)
                    params.append('senderid', senderId);
                params.append('msg', message);
                const res = await fetch('https://api.mimsms.com/api/sendsms', {
                    method: 'POST',
                    body: params,
                });
                const text = await res.text();
                gatewayResponse = text;
                status = res.ok ? 'DELIVERED' : 'FAILED';
            }
            else if (provider === 'SSL_WIRELESS') {
                const payload = {
                    api_token: apiKey,
                    sid: senderId,
                    msisdn: phone,
                    sms: message,
                    csms_id: Math.random().toString(36).substring(2, 12),
                };
                const res = await fetch('https://smsplus.sslwireless.com/api/v3/send-sms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const json = (await res.json());
                gatewayResponse = JSON.stringify(json);
                status = res.ok && json.status_code === 200 ? 'DELIVERED' : 'FAILED';
            }
            else if (provider === 'CUSTOM' && settings?.sms_gateway_url) {
                const res = await fetch(settings.sms_gateway_url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                    body: JSON.stringify({ phone, message, senderId }),
                });
                gatewayResponse = await res.text();
                status = res.ok ? 'DELIVERED' : 'FAILED';
            }
            else {
                status = 'FAILED';
                gatewayResponse = `Unsupported SMS provider: ${provider}`;
            }
        }
        catch (err) {
            status = 'FAILED';
            gatewayResponse = `Gateway connection error: ${err.message}`;
        }
    }
    // Record audit delivery log
    const log = await SmsLog.create({
        recipient_phone: phone,
        recipient_name: options?.restaurant?.owner_name || '',
        restaurant_name: options?.restaurant?.name || '',
        restaurant_id: options?.restaurant?._id,
        message,
        char_count: units.charCount,
        sms_count: units.smsCount,
        is_unicode: units.isUnicode,
        provider,
        sender_id: senderId,
        status,
        gateway_response: gatewayResponse,
        campaign_type: options?.campaign_type || 'BULK',
    });
    return { success: status === 'DELIVERED', log, gatewayResponse };
}
// 4. Dynamic tag injector
export function replaceDynamicTags(template, restaurant, portalUrl = 'https://pos.okobiz.com') {
    const expiryFormatted = restaurant.subscription_end
        ? new Date(restaurant.subscription_end).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
        : 'N/A';
    return template
        .replace(/{restaurant_name}/g, restaurant.name || 'Valued Restaurant')
        .replace(/{owner_name}/g, restaurant.owner_name || 'Restaurant Owner')
        .replace(/{expiry_date}/g, expiryFormatted)
        .replace(/{due_amount}/g, `${restaurant.payment_amount || 0} BDT`)
        .replace(/{portal_url}/g, portalUrl);
}
//# sourceMappingURL=sms.service.js.map