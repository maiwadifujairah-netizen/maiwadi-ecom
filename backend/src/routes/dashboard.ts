import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { dashboardStats } from '../controllers/dashboard.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', requireAdmin, dashboardStats);
