import { Router } from 'express';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js';
import { paymentConfig, placeOrder, verifyPayment, myOrders, listOrders, getOrder, updateOrder } from '../controllers/orders.js';

export const ordersRouter = Router();

ordersRouter.get('/payment-config', paymentConfig);
ordersRouter.post('/', optionalAuth, placeOrder);
ordersRouter.post('/:id/verify-payment', verifyPayment);
ordersRouter.get('/mine', requireAuth, myOrders);
ordersRouter.get('/', requireAdmin, listOrders);
ordersRouter.get('/:id', requireAdmin, getOrder);
ordersRouter.patch('/:id', requireAdmin, updateOrder);
