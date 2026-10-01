import type { Request, Response } from 'express';
import { z } from 'zod';
import { Order, User } from '../models/index.js';
import { HttpError, escapeRegex, paging } from '../utils/http.js';

export const listCustomers = async (req: Request, res: Response) => {
  const { page, limit, skip } = paging(req.query);
  const filter: Record<string, unknown> = { role: 'customer' };
  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    const rx = { $regex: escapeRegex(req.query.search.trim()), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  const stats = await Order.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: { $cond: [{ $ne: ['$status', 'Cancelled'] }, '$total', 0] } } } },
  ]);
  const byId = new Map(stats.map((s) => [String(s._id), s]));
  res.json({
    items: users.map((u) => ({ ...u, orders: byId.get(String(u._id))?.orders ?? 0, spent: byId.get(String(u._id))?.spent ?? 0 })),
    total, page, pages: Math.max(1, Math.ceil(total / limit)),
  });
};

export const getCustomer = async (req: Request, res: Response) => {
  const user = await User.findOne({ _id: req.params.id, role: 'customer' }).lean();
  if (!user) throw new HttpError(404, 'Customer not found');
  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).lean();
  res.json({ user, orders });
};

export const updateCustomerStatus = async (req: Request, res: Response) => {
  const { status } = z.object({ status: z.enum(['active', 'blocked']) }).parse(req.body);
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'customer' }, { status }, { returnDocument: 'after' });
  if (!user) throw new HttpError(404, 'Customer not found');
  res.json(user);
};
