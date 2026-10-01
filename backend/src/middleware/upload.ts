import multer from 'multer';
import { ALLOWED_IMAGE_TYPES } from '../services/storage.js';
import { HttpError } from '../utils/http.js';

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    file.mimetype in ALLOWED_IMAGE_TYPES ? cb(null, true) : cb(new HttpError(400, 'Only JPG, PNG, WebP or AVIF images are allowed')),
});
