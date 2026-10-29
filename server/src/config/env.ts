import dotenv from 'dotenv';
dotenv.config();

/**
 * Ensure a JWT duration value includes a time-unit suffix (e.g. '7d', '1h').
 * A bare number is interpreted as *seconds* by jsonwebtoken, which almost
 * certainly isn't intended – fall back to a safe default and warn loudly.
 */
function safeDuration(raw: string | undefined, fallback: string, label: string): string {
  if (!raw) return fallback;
  // If the value is purely numeric, it would be treated as seconds – fix it
  if (/^\d+$/.test(raw.trim())) {
    console.warn(
      `⚠️  [env] ${label}="${raw}" is a bare number and would be interpreted as ${raw} seconds. ` +
      `Using fallback "${fallback}" instead. Add a suffix like 'd', 'h', or 'm'.`
    );
    return fallback;
  }
  return raw;
}

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gastroflow',
  JWT_SECRET: process.env.JWT_SECRET || 'gastroflow_default_secret',
  JWT_EXPIRES_IN: safeDuration(process.env.JWT_EXPIRES_IN, '7d', 'JWT_EXPIRES_IN'),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'gastroflow_refresh_secret',
  JWT_REFRESH_EXPIRES_IN: safeDuration(process.env.JWT_REFRESH_EXPIRES_IN, '30d', 'JWT_REFRESH_EXPIRES_IN'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
};

