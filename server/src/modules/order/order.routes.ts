import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { protect } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema, processPaymentSchema, partialPaymentSchema, splitPaymentSchema, addItemsSchema, cancelItemSchema, bulkDeleteOrdersSchema } from './order.validation.js';

const router = Router();

router.use(protect);

router.get('/', OrderController.getAll);
router.get('/kitchen', authorize('admin', 'kitchen'), OrderController.getKitchenOrders);
router.get('/billing', authorize('admin', 'cashier'), OrderController.getBillingOrders);
router.get('/waiter', authorize('admin', 'waiter'), OrderController.getWaiterOrders);
router.post('/bulk-delete', authorize('admin', 'cashier'), validate(bulkDeleteOrdersSchema), OrderController.bulkDelete);
router.delete('/bulk-delete', authorize('admin', 'cashier'), validate(bulkDeleteOrdersSchema), OrderController.bulkDelete);
router.get('/:id', OrderController.getById);
router.post('/', authorize('admin', 'waiter'), validate(createOrderSchema), OrderController.create);
router.patch('/:id/status', validate(updateOrderStatusSchema), OrderController.updateStatus);
router.patch('/:id/add-items', authorize('admin', 'waiter', 'cashier'), validate(addItemsSchema), OrderController.addItems);
router.patch('/:id/cancel-item', authorize('admin', 'waiter', 'cashier'), validate(cancelItemSchema), OrderController.cancelItem);
router.post('/:id/payment', authorize('admin', 'cashier'), validate(processPaymentSchema), OrderController.processPayment);
router.post('/:id/partial-payment', authorize('admin', 'cashier'), validate(partialPaymentSchema), OrderController.addPartialPayment);
router.post('/:id/split-payment', authorize('admin', 'cashier'), validate(splitPaymentSchema), OrderController.processSplitPayment);
router.delete('/:id', authorize('admin', 'cashier'), OrderController.delete);

export default router;
