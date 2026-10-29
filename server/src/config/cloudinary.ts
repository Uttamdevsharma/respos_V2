import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from './env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Uploads a Multer file buffer directly to Cloudinary
 * @param file Express.Multer.File with buffer (from memoryStorage)
 * @param folder Cloudinary folder name (e.g. 'menu', 'branding')
 * @returns Secure HTTPS URL of the uploaded image
 */
export const uploadBufferToCloudinary = (
  file: Express.Multer.File,
  folder: string = 'gastroflow'
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `gastroflow/${folder}`,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload failed'));
        }
        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

/**
 * Safely delete an image from Cloudinary given its full URL or public_id
 */
export const deleteFromCloudinary = async (imageUrl: string | null | undefined): Promise<void> => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) return;
  try {
    // Extract public_id from URL: e.g. https://res.cloudinary.com/.../image/upload/v1234/gastroflow/menu/xyz.jpg
    const parts = imageUrl.split('/upload/');
    if (parts.length < 2) return;
    const afterUpload = parts[1]; // v1234/gastroflow/menu/xyz.jpg
    const withoutVersion = afterUpload.replace(/^v\d+\//, ''); // gastroflow/menu/xyz.jpg
    const publicId = withoutVersion.substring(0, withoutVersion.lastIndexOf('.')); // gastroflow/menu/xyz
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (err) {
    console.error('Failed to delete image from Cloudinary:', err);
  }
};

export default cloudinary;
