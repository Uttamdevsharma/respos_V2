import { Router } from 'express';
import { PublicController } from './public.controller.js';
import { QuotationController } from '../super-admin/quotation.controller.js';
const router = Router();
router.get('/platform-settings', PublicController.getPlatformSettings);
router.get('/plans', PublicController.getPlans);
router.post('/contact', PublicController.contact);
router.get('/quotations/:id', QuotationController.getPublicQuotation);
export default router;
//# sourceMappingURL=public.routes.js.map