import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { productsRouter } from './routes/products.js';
import { categoriesRouter } from './routes/categories.js';
import { bannersRouter } from './routes/banners.js';
import { ordersRouter } from './routes/orders.js';
import { customersRouter } from './routes/customers.js';
import { contactRouter } from './routes/contact.js';
import { settingsRouter } from './routes/settings.js';
import { dashboardRouter } from './routes/dashboard.js';
import { uploadsRouter } from './routes/uploads.js';
import { errorHandler, notFound } from './middleware/error.js';

export function createApp() {
  const app = express();
  // Render proxy + Vercel rewrite = 2 hops; needed so rate limits see the real client IP
  app.set('trust proxy', Number(process.env.TRUST_PROXY ?? (env.isProd ? 2 : 0)));
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.clientUrls, credentials: true }));
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());

  // 200 only when the database is connected, so Render's health check catches a lost DB connection.
  app.get('/api/health', (_req, res) => {
    const db = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(db === 'connected' ? 200 : 503).json({ ok: db === 'connected', db });
  });
  app.use('/api/auth', authRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/banners', bannersRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/contact', contactRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/admin/dashboard', dashboardRouter);
  app.use('/api/uploads', uploadsRouter);
  app.use('/uploads', express.static(path.resolve('uploads'), { maxAge: '7d' }));
  app.use('/static', express.static(path.resolve('static'), { maxAge: '30d' })); // seed product image

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
