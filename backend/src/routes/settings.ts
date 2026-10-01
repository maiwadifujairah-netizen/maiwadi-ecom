import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { getSiteSettings, updateSettings } from '../controllers/settings.js';

export const settingsRouter = Router();

settingsRouter.get('/', getSiteSettings);
settingsRouter.put('/', requireAdmin, updateSettings);
