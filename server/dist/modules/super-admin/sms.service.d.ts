import { SmsCampaignType } from '../../models/SmsLog.js';
import { IRestaurant } from '../../models/Restaurant.js';
export declare function calculateSmsUnits(text: string): {
    smsCount: number;
    isUnicode: boolean;
    charCount: number;
};
export declare function formatBdPhone(phone: string): string;
export declare function sendPlatformSms(toPhone: string, message: string, options?: {
    restaurant?: IRestaurant;
    campaign_type?: SmsCampaignType;
}): Promise<{
    success: boolean;
    log: import("mongoose").Document<unknown, {}, import("../../models/SmsLog.js").ISmsLog, {}, {}> & import("../../models/SmsLog.js").ISmsLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    };
    gatewayResponse: string;
}>;
export declare function replaceDynamicTags(template: string, restaurant: IRestaurant, portalUrl?: string): string;
//# sourceMappingURL=sms.service.d.ts.map