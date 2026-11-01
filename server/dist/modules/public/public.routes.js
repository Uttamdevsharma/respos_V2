import { Router } from 'express';
import { PublicController } from './public.controller.js';
const router = Router();
router.get('/platform-settings', PublicController.getPlatformSettings);
router.get('/plans', PublicController.getPlans);
router.post('/contact', PublicController.contact);
export default router;
//# sourceMappingURL=public.routes.js.map