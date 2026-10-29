import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { protect } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/stats', DashboardController.getStats);
router.get('/reports', DashboardController.getReports);

export default router;
