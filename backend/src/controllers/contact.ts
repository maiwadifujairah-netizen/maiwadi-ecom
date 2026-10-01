import type { Request, Response } from 'express';
import { z } from 'zod';
import { Inquiry } from '../models/index.js';
import { HttpError, paging } from '../utils/http.js';

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  email: z.email('Please enter a valid email').max(120),
  phone: z.string().trim().max(30).optional().default(''),
  message: z.string().trim().min(10, 'Message should be at least 10 characters').max(3000),
});

export const submitInquiry = async (req: Request, res: Response) => {
  await Inquiry.create(schema.parse(req.body));
  res.status(201).json({ ok: true });
};

export const listInquiries = async (req: Request, res: Response) => {
  const { page, limit, skip } = paging(req.query);
  const filter: Record<string, unknown> = ['new', 'read', 'resolved'].includes(String(req.query.status)) ? { status: String(req.query.status) } : {};
  const [items, total] = await Promise.all([
    Inquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Inquiry.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
};

export const updateInquiry = async (req: Request, res: Response) => {
  const { status } = z.object({ status: z.enum(['new', 'read', 'resolved']) }).parse(req.body);
  const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });
  if (!inquiry) throw new HttpError(404, 'Inquiry not found');
  res.json(inquiry);
};

export const deleteInquiry = async (req: Request, res: Response) => {
  if (!(await Inquiry.findByIdAndDelete(req.params.id))) throw new HttpError(404, 'Inquiry not found');
  res.json({ ok: true });
};
