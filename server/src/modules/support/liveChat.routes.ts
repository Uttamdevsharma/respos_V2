import { Router } from 'express';
import {
  createVisitorSession,
  getVisitorSession,
  postVisitorMessage,
  endVisitorSession,
  getLiveChatStats,
  getAdminSessions,
  getAdminSessionDetails,
  postAdminMessage,
  updateAdminSessionStatus,
} from './liveChat.controller.js';
import { protect } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';

// Public routes for visitors
export const publicLiveChatRouter = Router();
publicLiveChatRouter.post('/session', createVisitorSession);
publicLiveChatRouter.get('/session/:token', getVisitorSession);
publicLiveChatRouter.post('/session/:token/messages', postVisitorMessage);
publicLiveChatRouter.post('/session/:token/end', endVisitorSession);

// Protected routes for Super Admin
export const superAdminLiveChatRouter = Router();
superAdminLiveChatRouter.use(protect);
superAdminLiveChatRouter.use(authorize('SUPER_ADMIN'));

superAdminLiveChatRouter.get('/stats', getLiveChatStats);
superAdminLiveChatRouter.get('/sessions', getAdminSessions);
superAdminLiveChatRouter.get('/sessions/:id', getAdminSessionDetails);
superAdminLiveChatRouter.post('/sessions/:id/messages', postAdminMessage);
superAdminLiveChatRouter.patch('/sessions/:id/status', updateAdminSessionStatus);

