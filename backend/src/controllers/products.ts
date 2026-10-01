import type { Request, Response } from 'express';
import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { Category, Product } from '../models/index.js';
import { HttpError, escapeRegex, paging, slugify } from '../utils/http.js';

const imageUrl = z.string().trim().refine((s) => /^https?:\/\//.test(s) || s.startsWith('/'), 'Invalid image URL');
const schema = z.object({
  name: z.string().trim().min(2).max(120),
  shortDescription: z.string().trim().max(240).optional().default(''),
  description: z.string().trim().max(5000).optional().default(''),
  images: z.array(imageUrl).max(8).default([]),
  price: z.coerce.number().min(0).max(1_000_000),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  category: z.string().nullable().optional().transform((v) => (v ? v : null)),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(true),
});

async function uniqueSlug(name: string, excludeId?: string) {
  const base = slugify(name) || 'product';
  let slug = base;
  for (let i = 2; await Product.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) }); i++) slug = `${base}-${i}`;
  return slug;
}

async function checkCategory(id: string | null) {
  if (id && !(await Category.exists({ _id: id }))) throw new HttpError(400, 'Selected category does not exist');
}

function listFilter(q: Record<string, unknown>, activeOnly: boolean) {
  const filter: Record<string, unknown> = activeOnly ? { isActive: true } : {};
  if (typeof q.search === 'string' && q.search.trim()) filter.name = { $regex: escapeRegex(q.search.trim()), $options: 'i' };
  if (typeof q.category === 'string' && isValidObjectId(q.category)) filter.category = q.category;
  if (q.featured === 'true') filter.featured = true;
  return filter;
}

async function list(q: Record<string, unknown>, activeOnly: boolean) {
  const { page, limit, skip } = paging(q, 24);
  const filter = listFilter(q, activeOnly);
  const [items, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

export const listProducts = async (req: Request, res: Response) => {
  res.json(await list(req.query, true));
};

export const listProductsAdmin = async (req: Request, res: Response) => {
  res.json(await list(req.query, false));
};

export const getProduct = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const product = await Product.findOne({ isActive: true, ...(isValidObjectId(slug) ? { _id: slug } : { slug }) })
    .populate('category', 'name slug')
    .lean();
  if (!product) throw new HttpError(404, 'Product not found');
  const related = await Product.find({ isActive: true, _id: { $ne: product._id }, ...(product.category && { category: product.category._id }) })
    .limit(4)
    .lean();
  res.json({ product, related });
};

export const createProduct = async (req: Request, res: Response) => {
  const data = schema.parse(req.body);
  await checkCategory(data.category);
  const product = await Product.create({ ...data, slug: await uniqueSlug(data.name) });
  res.status(201).json(product);
};

export const updateProduct = async (req: Request, res: Response) => {
  const data = schema.parse(req.body);
  await checkCategory(data.category);
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { ...data, slug: await uniqueSlug(data.name, String(req.params.id)) },
    { returnDocument: 'after', runValidators: true },
  );
  if (!product) throw new HttpError(404, 'Product not found');
  res.json(product);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  res.json({ ok: true });
};
