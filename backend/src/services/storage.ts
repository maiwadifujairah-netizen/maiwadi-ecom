import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryEnabled, env } from '../config/env.js';
import { HttpError } from '../utils/http.js';

export const ALLOWED_IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' } as const;

if (cloudinaryEnabled) cloudinary.config({ ...env.cloudinary, secure: true });

/** Stores an uploaded image and returns its public URL (Cloudinary, or /uploads/... on local disk in dev). */
export async function storeImage(file: Express.Multer.File, folder: 'products' | 'banners'): Promise<string> {
  if (cloudinaryEnabled) {
    return new Promise((resolve, reject) =>
      cloudinary.uploader
        .upload_stream({ folder: `mai-wadi/${folder}`, resource_type: 'image' }, (err, result) =>
          err || !result ? reject(err ?? new Error('Upload failed')) : resolve(result.secure_url),
        )
        .end(file.buffer),
    );
  }
  // ponytail: local disk is dev-only (Render's disk is ephemeral) — production requires Cloudinary
  if (env.isProd) throw new HttpError(500, 'Image storage is not configured (set CLOUDINARY_* env vars)');
  const name = `${crypto.randomUUID()}.${ALLOWED_IMAGE_TYPES[file.mimetype as keyof typeof ALLOWED_IMAGE_TYPES]}`;
  await fs.writeFile(path.resolve('uploads', name), file.buffer);
  return `/uploads/${name}`;
}
