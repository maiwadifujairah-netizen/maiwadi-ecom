import type { Request, Response } from 'express';
import { Inquiry, Order, Product, User } from '../models/index.js';

export const dashboardStats = async (_req: Request, res: Response) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const notCancelled = { status: { $ne: 'Cancelled' } };
  const [products, lowStock, orders, pending, completed, customers, newInquiries, sales, sales30, recent] = await Promise.all([
    Product.countDocuments(),
    Product.find({ stock: { $lte: 10 } }).select('name stock').limit(5).lean(),
    Order.countDocuments(),
    Order.countDocuments({ status: 'Pending' }),
    Order.countDocuments({ status: 'Delivered' }),
    User.countDocuments({ role: 'customer' }),
    Inquiry.countDocuments({ status: 'new' }),
    Order.aggregate([{ $match: notCancelled }, { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { ...notCancelled, createdAt: { $gte: since } } }, { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }]),
    Order.find().sort({ createdAt: -1 }).limit(6).select('orderNumber customer.name total currency status createdAt').lean(),
  ]);
  res.json({
    products, orders, pending, completed, customers, newInquiries, lowStock, recent,
    sales: { total: sales[0]?.total ?? 0, orders: sales[0]?.count ?? 0 },
    sales30: { total: sales30[0]?.total ?? 0, orders: sales30[0]?.count ?? 0 },
  });
};
