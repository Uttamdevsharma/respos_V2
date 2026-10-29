import { Router } from 'express';
import { SettingsController } from './settings.controller.js';
import { protect } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
const router = Router();
router.use(protect);
router.get('/', SettingsController.get);
router.put('/', authorize('admin'), SettingsController.update);
export default router;
//# sourceMappingURL=settings.routes.js.map