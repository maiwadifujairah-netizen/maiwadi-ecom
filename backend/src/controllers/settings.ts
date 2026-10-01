import type { Request, Response } from 'express';
import { z } from 'zod';
import { Settings } from '../models/index.js';

const str = (max: number) => z.string().trim().max(max).optional().default('');
const url = str(300).refine((s) => !s || /^https?:\/\//.test(s), 'Links must start with http(s)://');
const block = z.array(z.object({ title: z.string().trim().max(80), text: z.string().trim().max(400) })).max(8).default([]);

const schema = z.object({
  siteName: z.string().trim().min(1).max(60),
  tagline: str(120),
  currency: z.string().trim().toUpperCase().length(3),
  deliveryFee: z.coerce.number().min(0).max(10000),
  phone: str(30),
  mobile: str(30),
  whatsapp: str(20).transform((s) => s.replace(/\D/g, '')),
  email: z.union([z.literal(''), z.email()]).default(''),
  address: str(300),
  workingHours: str(120),
  socials: z.object({ facebook: url, instagram: url, x: url, tiktok: url }).default({ facebook: '', instagram: '', x: '', tiktok: '' }),
  heroTitle: str(120),
  heroSubtitle: str(400),
  features: block,
  aboutIntro: str(3000),
  aboutMission: str(2000),
  aboutValues: block,
  aboutDelivery: str(2000),
});

export const getSettings = async () =>
  (await Settings.findOne({ key: 'site' }).lean()) ?? (await Settings.create({ key: 'site' })).toObject();

export const getSiteSettings = async (_req: Request, res: Response) => {
  res.json(await getSettings());
};

export const updateSettings = async (req: Request, res: Response) => {
  const data = schema.parse(req.body);
  res.json(await Settings.findOneAndUpdate({ key: 'site' }, data, { returnDocument: 'after', upsert: true, runValidators: true }));
};
