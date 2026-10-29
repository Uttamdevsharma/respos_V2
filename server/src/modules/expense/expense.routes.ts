import { Router } from 'express';
import { protect } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { ExpenseController } from './expense.controller.js';

const router = Router();

router.use(protect);
router.use(authorize('admin'));

router.post('/', ExpenseController.create);
router.get('/', ExpenseController.getAll);
router.delete('/:id', ExpenseController.delete);
router.get('/summary', ExpenseController.getSummary);

export default router;
