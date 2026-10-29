import { Router } from 'express';
import { CategoryController } from './category.controller.js';
import { protect } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from './category.validation.js';

const router = Router();

router.use(protect);

router.get('/', CategoryController.getAll);
router.get('/:id', CategoryController.getById);
router.post('/', authorize('admin'), validate(createCategorySchema), CategoryController.create);
router.put('/:id', authorize('admin'), validate(updateCategorySchema), CategoryController.update);
router.delete('/:id', authorize('admin'), CategoryController.delete);

export default router;
