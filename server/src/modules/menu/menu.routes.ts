import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { MenuController } from './menu.controller.js';
import { protect } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createMenuItemSchema, updateMenuItemSchema } from './menu.validation.js';

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
    } else {
      cb(new Error('Only image files (jpg, png, webp) are allowed'));
    }
  },
});

const router = Router();

router.use(protect);

router.get('/', MenuController.getAll);
router.get('/:id', MenuController.getById);
router.post('/', authorize('admin'), upload.single('image'), validate(createMenuItemSchema), MenuController.create);
router.put('/:id', authorize('admin'), upload.single('image'), validate(updateMenuItemSchema), MenuController.update);
router.delete('/:id', authorize('admin'), MenuController.delete);
router.patch('/:id/toggle', authorize('admin', 'kitchen'), MenuController.toggleAvailability);

export default router;
