import { Router } from 'express';
import { NoticeController } from '../super-admin/notice.controller.js';
import { protect } from '../../middleware/auth.js';
const router = Router();
// Protect for authenticated restaurant users
router.use(protect);
router.get('/', NoticeController.getTenantNotices);
router.post('/:id/read', NoticeController.markNoticeRead);
router.post('/read-all', NoticeController.markAllRead);
export default router;
//# sourceMappingURL=tenant-notice.routes.js.map