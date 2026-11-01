export declare function sendOtpEmail(toEmail: string, otp: string, restaurantName?: string): Promise<{
    success: boolean;
    devOtp?: string;
}>;
export declare function sendApprovalEmail(toEmail: string, restaurantName: string, planName: string, loginUrl: string): Promise<boolean>;
export declare function sendRejectionEmail(toEmail: string, restaurantName: string, reason: string): Promise<boolean>;
//# sourceMappingURL=mail.d.ts.map