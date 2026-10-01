import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAdmin } from '../middleware/auth.js';
import { submitInquiry, listInquiries, updateInquiry, deleteInquiry } from '../controllers/contact.js';

export const contactRouter = Router();

contactRouter.post('/', rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, message: { message: 'Too many messages, please try again later' } }), submitInquiry);
contactRouter.get('/', requireAdmin, listInquiries);
contactRouter.patch('/:id', requireAdmin, updateInquiry);
contactRouter.delete('/:id', requireAdmin, deleteInquiry);
