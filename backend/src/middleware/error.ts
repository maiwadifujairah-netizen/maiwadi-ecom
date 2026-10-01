import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import multer from 'multer';
import { HttpError } from '../utils/http.js';

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, 'Route not found'));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message, details: err.details });
  if (err instanceof ZodError)
    return res.status(400).json({
      message: err.issues[0]?.message ? `${err.issues[0].path.join('.')}: ${err.issues[0].message}` : 'Invalid input',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  if (err instanceof mongoose.Error.CastError) return res.status(400).json({ message: 'Invalid id' });
  if (err instanceof mongoose.Error.ValidationError) return res.status(400).json({ message: err.message });
  if (err instanceof multer.MulterError) return res.status(400).json({ message: err.message });
  if ((err as { code?: number })?.code === 11000) return res.status(409).json({ message: 'A record with that value already exists' });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
}
