import { Router } from 'express';
import multer from 'multer';
import { SuperAdminController } from './super-admin.controller.js';
import { protect } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const router = Router();

// Protect all Super Admin routes strictly for SUPER_ADMIN role
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
router.put(
  '/settings',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'login_image', maxCount: 1 },
  ]),
  SuperAdminController.updateSettings
);

export default router;
