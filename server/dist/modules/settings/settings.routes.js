import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { SettingsController } from './settings.controller.js';
import { protect } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
// Multer memory storage for branding images
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files (jpg, png, webp) are allowed'));
        }
    },
});
const router = Router();
router.use(protect);
router.get('/', SettingsController.get);
router.put('/', authorize('admin'), SettingsController.update);
router.post('/upload-images', authorize('admin'), upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'loginImage', maxCount: 1 }]), SettingsController.uploadImages);
export default router;
//# sourceMappingURL=settings.routes.js.map