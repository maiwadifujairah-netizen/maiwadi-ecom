import type { Request, Response } from 'express';
import { z } from 'zod';
import { Banner, BANNER_POSITIONS } from '../models/index.js';
import { HttpError } from '../utils/http.js';

const link = z.string().trim().max(500).refine((s) => !s || s.startsWith('/') || /^https?:\/\//.test(s), 'Link must start with / or http(s)://');
const imageUrl = z.string().trim().max(1000).refine((s) => !s || s.startsWith('/') || /^https?:\/\//.test(s), 'Invalid image URL');
const schema = z.object({
  placement: z.enum(['hero', 'promo']).default('promo'),
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(300).optional().default(''),
  image: imageUrl.refine((s) => s.length > 0, 'Desktop banner image is required'),
  mobileImage: imageUrl.optional().default(''),
  desktopPosition: z.enum(BANNER_POSITIONS).default('center'),
  mobilePosition: z.enum(BANNER_POSITIONS).default('center'),
  showTitle: z.boolean().default(true),
  showSubtitle: z.boolean().default(true),
  showButtons: z.boolean().default(true),
  buttonText: z.string().trim().max(40).optional().default(''),
  buttonLink: link.optional().default(''),
  secondaryButtonText: z.string().trim().max(40).optional().default(''),
  secondaryButtonLink: link.optional().default(''),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(999).default(0),
});

export const listActiveBanners = async (_req: Request, res: Response) => {
  res.json(await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean());
};

export const listAllBanners = async (_req: Request, res: Response) => {
  res.json(await Banner.find().sort({ order: 1, createdAt: -1 }).lean());
};

export const createBanner = async (req: Request, res: Response) => {
  res.status(201).json(await Banner.create(schema.parse(req.body)));
};

export const updateBanner = async (req: Request, res: Response) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, schema.parse(req.body), { returnDocument: 'after', runValidators: true });
  if (!banner) throw new HttpError(404, 'Banner not found');
  res.json(banner);
};

export const setBannerActive = async (req: Request, res: Response) => {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  const banner = await Banner.findByIdAndUpdate(req.params.id, { isActive }, { returnDocument: 'after' });
  if (!banner) throw new HttpError(404, 'Banner not found');
  res.json(banner);
};

export const deleteBanner = async (req: Request, res: Response) => {
  if (!(await Banner.findByIdAndDelete(req.params.id))) throw new HttpError(404, 'Banner not found');
  res.json({ ok: true });
};
