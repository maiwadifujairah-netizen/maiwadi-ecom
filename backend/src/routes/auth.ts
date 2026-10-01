import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { optionalAuth } from '../middleware/auth.js';
import { register, login, logout, me } from '../controllers/auth.js';

export const authRouter = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, message: { message: 'Too many attempts, try again later' } });

authRouter.post('/register', limiter, register);
authRouter.post('/login', limiter, login);
authRouter.post('/logout', logout);
authRouter.get('/me', optionalAuth, me);
