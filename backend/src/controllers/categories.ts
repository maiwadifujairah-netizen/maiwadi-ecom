import type { Request, Response } from 'express';
import { z } from 'zod';
import { Category, Product } from '../models/index.js';
import { HttpError, slugify } from '../utils/http.js';

const schema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().max(300).optional().default(''),
});

export const listCategories = async (_req: Request, res: Response) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json(categories.map((c) => ({ ...c, productCount: byId.get(String(c._id)) ?? 0 })));
};

export const createCategory = async (req: Request, res: Response) => {
  const data = schema.parse(req.body);
  res.status(201).json(await Category.create({ ...data, slug: slugify(data.name) }));
};

export const updateCategory = async (req: Request, res: Response) => {
  const data = schema.parse(req.body);
  const cat = await Category.findByIdAndUpdate(req.params.id, { ...data, slug: slugify(data.name) }, { returnDocument: 'after', runValidators: true });
  if (!cat) throw new HttpError(404, 'Category not found');
  res.json(cat);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const inUse = await Product.countDocuments({ category: req.params.id });
  if (inUse) throw new HttpError(409, `Move or delete the ${inUse} product(s) in this category first`);
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) throw new HttpError(404, 'Category not found');
  res.json({ ok: true });
};
