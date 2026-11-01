import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadBufferToCloudinary } from '../config/cloudinary.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function uploadFileSafe(file, folder = 'kyc') {
    // Try Cloudinary first
    try {
        const res = await uploadBufferToCloudinary(file, folder);
        if (res?.secure_url)
            return res.secure_url;
    }
    catch (error) {
        console.warn(`[UPLOAD] Cloudinary upload failed, falling back to local storage:`, error);
    }
    // Fallback to local storage in /uploads/folder
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = path.extname(file.originalname) || '.jpg';
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, file.buffer);
    return `/uploads/${folder}/${fileName}`;
}
//# sourceMappingURL=fileUpload.js.map