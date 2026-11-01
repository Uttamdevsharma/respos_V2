import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
/**
 * Uploads a Multer file buffer directly to Cloudinary
 * @param file Express.Multer.File with buffer (from memoryStorage)
 * @param folder Cloudinary folder name (e.g. 'menu', 'branding')
 * @returns Secure HTTPS URL of the uploaded image
 */
export declare const uploadBufferToCloudinary: (file: Express.Multer.File, folder?: string) => Promise<UploadApiResponse>;
/**
 * Safely delete an image from Cloudinary given its full URL or public_id
 */
export declare const deleteFromCloudinary: (imageUrl: string | null | undefined) => Promise<void>;
export default cloudinary;
//# sourceMappingURL=cloudinary.d.ts.map