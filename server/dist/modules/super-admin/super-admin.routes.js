import { Router } from 'express';
import multer from 'multer';
import { SuperAdminController } from './super-admin.controller.js';
import { QuotationController } from './quotation.controller.js';
import { NoticeController } from './notice.controller.js';
import { SmsController } from './sms.controller.js';
import { PlatformStaffController } from './staff.controller.js';
import { protect } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
const router = Router();
// Protect all Super Admin routes strictly for SUPER_ADMIN (and platform staff)
router.use(protect);
router.use(authorize('SUPER_ADMIN'));
// 1. Overview Dashboard
router.get('/overview', SuperAdminController.getOverview);
// 2. Pending Verifications & KYC
router.get('/verifications', SuperAdminController.getPendingVerifications);
router.post('/verifications/:id/approve', SuperAdminController.approveRestaurant);
router.post('/verifications/:id/reject', SuperAdminController.rejectRestaurant);
// 3. Business / Pharmacy Directory & 4-Tab Drilldown
router.get('/businesses', SuperAdminController.getRestaurants);
router.get('/businesses/:id', SuperAdminController.getBusinessDetails);
router.patch('/businesses/:id/status', SuperAdminController.updateRestaurantStatus);
// Backwards compatibility alias for /restaurants
router.get('/restaurants', SuperAdminController.getRestaurants);
router.get('/restaurants/:id', SuperAdminController.getBusinessDetails);
router.patch('/restaurants/:id/status', SuperAdminController.updateRestaurantStatus);
// 4. Demo Accounts & Inbound Leads
router.get('/demo-accounts', SuperAdminController.getDemoAccounts);
router.post('/demo-accounts', SuperAdminController.createDemoAccount);
router.patch('/demo-accounts/lead/:id', SuperAdminController.updateLeadStatus);
// 5. Subscription Plans Management (3 Modes)
router.get('/plans', SuperAdminController.getPlans);
router.post('/plans', SuperAdminController.createPlan);
router.put('/plans/:id', SuperAdminController.updatePlan);
router.delete('/plans/:id', SuperAdminController.deletePlan);
// 6. Platform Settings & Branding
router.get('/settings', SuperAdminController.getSettings);
router.put('/settings', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'login_image', maxCount: 1 },
]), SuperAdminController.updateSettings);
// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1: Quotations System
// ─────────────────────────────────────────────────────────────────────────────
router.get('/quotations/next-ref', QuotationController.getNextRefNo);
router.get('/quotations', QuotationController.getAll);
router.get('/quotations/:id', QuotationController.getById);
router.post('/quotations', QuotationController.create);
router.put('/quotations/:id', QuotationController.update);
router.delete('/quotations/:id', QuotationController.delete);
router.patch('/quotations/:id/status', QuotationController.updateStatus);
router.post('/quotations/:id/send-email', QuotationController.sendEmail);
// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2: System Notices & Announcements
// ─────────────────────────────────────────────────────────────────────────────
router.get('/notices', NoticeController.getAll);
router.post('/notices', NoticeController.create);
router.put('/notices/:id', NoticeController.update);
router.delete('/notices/:id', NoticeController.delete);
router.patch('/notices/:id/toggle', NoticeController.toggleField);
// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3: SMS Gateway & Campaign Dispatcher
// ─────────────────────────────────────────────────────────────────────────────
router.get('/sms/settings', SmsController.getSettings);
router.put('/sms/settings', SmsController.updateSettings);
router.post('/sms/test', SmsController.testSms);
router.get('/sms/audience-count', SmsController.getAudienceCount);
router.post('/sms/campaign', SmsController.dispatchCampaign);
router.get('/sms/logs', SmsController.getLogs);
router.get('/sms/stats', SmsController.getStats);
// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4: Platform Staff Governance & Roles
// ─────────────────────────────────────────────────────────────────────────────
router.get('/staff', PlatformStaffController.getAll);
router.post('/staff', PlatformStaffController.create);
router.put('/staff/:id', PlatformStaffController.update);
router.patch('/staff/:id/toggle', PlatformStaffController.toggleActive);
router.post('/staff/:id/reset-password', PlatformStaffController.resetPassword);
router.delete('/staff/:id', PlatformStaffController.delete);
router.get('/roles', PlatformStaffController.getRoles);
router.post('/roles', PlatformStaffController.createRole);
router.put('/roles/:id', PlatformStaffController.updateRole);
router.delete('/roles/:id', PlatformStaffController.deleteRole);
export default router;
//# sourceMappingURL=super-admin.routes.js.map