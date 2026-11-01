import { Router } from 'express';
import { SubscriptionController } from './subscription.controller.js';
import { protect } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
const router = Router();
router.use(protect);
router.use(authorize('admin', 'OWNER'));
router.get('/current', SubscriptionController.getCurrent);
router.post('/upgrade', SubscriptionController.upgrade);
export default router;
//# sourceMappingURL=subscription.routes.js.map