import type { Request, Response } from 'express';
import { storeImage } from '../services/storage.js';
import { HttpError } from '../utils/http.js';

export const uploadImage = async (req: Request, res: Response) => {
  if (!req.file) throw new HttpError(400, 'No image provided');
  const folder = req.query.folder === 'banners' ? 'banners' : 'products';
  res.status(201).json({ url: await storeImage(req.file, folder) });
};
