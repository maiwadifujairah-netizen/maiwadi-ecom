import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { imageUpload } from '../middleware/upload.js';
import { uploadImage } from '../controllers/uploads.js';

export const uploadsRouter = Router();

uploadsRouter.post('/', requireAdmin, imageUpload.single('image'), uploadImage);
