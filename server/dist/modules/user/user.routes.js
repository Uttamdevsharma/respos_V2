import { Router } from 'express';
import { UserController } from './user.controller.js';
import { protect } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema } from './user.validation.js';
const router = Router();
router.use(protect, authorize('admin'));
router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.post('/', validate(createUserSchema), UserController.create);
router.put('/:id', validate(updateUserSchema), UserController.update);
router.delete('/:id', UserController.delete);
router.patch('/:id/toggle', UserController.toggleActive);
export default router;
//# sourceMappingURL=user.routes.js.map