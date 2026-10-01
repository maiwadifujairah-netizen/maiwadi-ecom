import './loadEnv.js';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

export const env = {
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: required('MONGODB_URI'),
  // Database inside the cluster; without it an Atlas URI with no /path silently uses "test"
  mongoDb: process.env.MONGODB_DB || 'maiwadi',
  jwtSecret: required('JWT_SECRET'),
  // Frontend + admin origins allowed by CORS
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174').split(',').map((s) => s.trim()).filter(Boolean),
  // 'lax' when apps reach the API same-site (dev on localhost, or via a /api rewrite); 'none' for cross-site API calls
  cookieSameSite: (process.env.COOKIE_SAMESITE === 'none' ? 'none' : 'lax') as 'lax' | 'none',
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  },
};

export const cloudinaryEnabled = Boolean(env.cloudinary.cloud_name && env.cloudinary.api_key && env.cloudinary.api_secret);
export const razorpayEnabled = Boolean(env.razorpay.keyId && env.razorpay.keySecret);

if (env.isProd && env.jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production');
