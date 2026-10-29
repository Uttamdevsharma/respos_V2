import { Router } from 'express';
import { TableController } from './table.controller.js';
import { protect } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createTableSchema, updateTableSchema } from './table.validation.js';
const router = Router();
router.use(protect);
router.get('/', TableController.getAll);
router.get('/:id', TableController.getById);
router.post('/', authorize('admin'), validate(createTableSchema), TableController.create);
router.put('/:id', authorize('admin'), validate(updateTableSchema), TableController.update);
router.delete('/:id', authorize('admin'), TableController.delete);
router.patch('/:id/status', TableController.updateStatus);
export default router;
//# sourceMappingURL=table.routes.js.map