import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { protect } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema } from './auth.validation.js';
const router = Router();
router.post('/login', validate(loginSchema), AuthController.login);
router.get('/me', protect, AuthController.getMe);
router.post('/logout', protect, AuthController.logout);
router.post('/refresh', AuthController.refresh);
export default router;
//# sourceMappingURL=auth.routes.js.map