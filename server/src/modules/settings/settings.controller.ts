import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import Settings from '../../models/Settings.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Delete a stored file from uploads folder safely */
function deleteFile(filePath: string | null | undefined) {
  if (!filePath) return;
  try {
    // filePath is like "/uploads/123-456.jpg" – strip leading slash
    const relative = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const absolute = path.join(__dirname, '..', '..', '..', relative);
    if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
  } catch (_) {
    // ignore unlink errors
  }
}

export class SettingsController {
  static get = catchAsync(async (_req: Request, res: Response) => {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    ApiResponse.success(res, settings);
  });

  static update = catchAsync(async (req: Request, res: Response) => {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    ApiResponse.success(res, settings, 'Settings updated');
  });

  /** Handle logo and loginImage uploads (multipart/form-data) */
  static uploadImages = catchAsync(async (req: Request, res: Response) => {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    // --- Logo ---
    if (req.body.deleteLogo === 'true') {
      deleteFile(settings.logo);
      deleteFromCloudinary(settings.logo).catch(() => {});
      settings.logo = undefined;
    } else if (files?.logo?.[0]) {
      deleteFile(settings.logo);
      deleteFromCloudinary(settings.logo).catch(() => {});
      const uploadRes = await uploadBufferToCloudinary(files.logo[0], 'branding');
      settings.logo = uploadRes.secure_url;
    }

    // --- Login Image ---
    if (req.body.deleteLoginImage === 'true') {
      deleteFile(settings.loginImage);
      deleteFromCloudinary(settings.loginImage).catch(() => {});
      settings.loginImage = undefined;
    } else if (files?.loginImage?.[0]) {
      deleteFile(settings.loginImage);
      deleteFromCloudinary(settings.loginImage).catch(() => {});
      const uploadRes = await uploadBufferToCloudinary(files.loginImage[0], 'branding');
      settings.loginImage = uploadRes.secure_url;
    }

    await settings.save();
    ApiResponse.success(res, settings, 'Branding images updated');
  });
}
