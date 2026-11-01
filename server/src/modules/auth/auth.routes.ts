import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { AuthController } from './auth.controller.js';
import { protect } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema } from './auth.validation.js';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype) || file.mimetype === 'application/pdf';
    if (ext || mime) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, png, webp) and PDF documents are allowed'));
    }
  },
});

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);
router.get('/me', protect, AuthController.getMe);
router.post('/logout', protect, AuthController.logout);
router.post('/refresh', AuthController.refresh);

// OTP & Registration
router.post('/send-otp', AuthController.sendOtp);
router.post('/verify-otp', AuthController.verifyOtp);
router.post(
  '/register-restaurant',
  upload.fields([
    { name: 'drugLicenseDoc', maxCount: 1 },
    { name: 'tradeLicenseDoc', maxCount: 1 },
    { name: 'nidFrontDoc', maxCount: 1 },
    { name: 'nidBackDoc', maxCount: 1 },
    { name: 'paymentScreenshot', maxCount: 1 },
  ]),
  AuthController.registerRestaurant
);

export default router;
