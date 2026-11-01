import { Router } from 'express';
import multer from 'multer';
import {
  createTenantTicket,
  getTenantTickets,
  getTicketDetails,
  postTicketReply,
  uploadTicketAttachment,
  getAdminTicketStats,
  getAdminTickets,
  updateAdminTicketStatus,
  getRestaurantsList,
} from './supportTicket.controller.js';
import { protect } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Tenant routes (Admin / OWNER / Super Admin)
export const tenantSupportTicketRouter = Router();
tenantSupportTicketRouter.use(protect);

tenantSupportTicketRouter.post('/', authorize('admin', 'OWNER', 'SUPER_ADMIN'), createTenantTicket);
tenantSupportTicketRouter.get('/', authorize('admin', 'OWNER', 'SUPER_ADMIN'), getTenantTickets);
tenantSupportTicketRouter.get('/:id', authorize('admin', 'OWNER', 'SUPER_ADMIN'), getTicketDetails);
tenantSupportTicketRouter.post('/:id/replies', authorize('admin', 'OWNER', 'SUPER_ADMIN'), postTicketReply);
tenantSupportTicketRouter.post(
  '/upload',
  authorize('admin', 'OWNER', 'SUPER_ADMIN'),
  upload.single('file'),
  uploadTicketAttachment
);

// Super Admin dedicated routes
export const superAdminSupportTicketRouter = Router();
superAdminSupportTicketRouter.use(protect);
superAdminSupportTicketRouter.use(authorize('SUPER_ADMIN'));

superAdminSupportTicketRouter.get('/stats', getAdminTicketStats);
superAdminSupportTicketRouter.get('/', getAdminTickets);
superAdminSupportTicketRouter.get('/restaurants', getRestaurantsList);
superAdminSupportTicketRouter.get('/:id', getTicketDetails);
superAdminSupportTicketRouter.post('/:id/replies', postTicketReply);
superAdminSupportTicketRouter.patch('/:id/status', updateAdminTicketStatus);
superAdminSupportTicketRouter.post('/upload', upload.single('file'), uploadTicketAttachment);

