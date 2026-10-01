import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { listActiveBanners, listAllBanners, createBanner, updateBanner, setBannerActive, deleteBanner } from '../controllers/banners.js';

export const bannersRouter = Router();

bannersRouter.get('/', listActiveBanners);
bannersRouter.get('/admin', requireAdmin, listAllBanners);
bannersRouter.post('/', requireAdmin, createBanner);
bannersRouter.put('/:id', requireAdmin, updateBanner);
bannersRouter.patch('/:id/active', requireAdmin, setBannerActive);
bannersRouter.delete('/:id', requireAdmin, deleteBanner);
