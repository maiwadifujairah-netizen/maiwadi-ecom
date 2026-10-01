import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/index.js';
import { setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { HttpError } from '../utils/http.js';

const publicUser = (u: { _id: unknown; name: string; email: string; phone?: string | null; role: string }) => ({
  id: String(u._id), name: u.name, email: u.email, phone: u.phone ?? '', role: u.role,
});

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(120),
  phone: z.string().trim().max(30).optional().default(''),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export const register = async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  if (await User.exists({ email: data.email.toLowerCase() })) throw new HttpError(409, 'An account with this email already exists');
  const user = await User.create({ ...data, password: await bcrypt.hash(data.password, 12), role: 'customer' });
  setAuthCookie(res, String(user._id));
  res.status(201).json({ user: publicUser(user) });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = z.object({ email: z.email(), password: z.string().min(1) }).parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) throw new HttpError(401, 'Invalid email or password');
  if (user.status !== 'active') throw new HttpError(403, 'This account has been disabled');
  setAuthCookie(res, String(user._id));
  res.json({ user: publicUser(user) });
};

export const logout = (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({ ok: true });
};

// 200 with null for guests, so every page load doesn't log a 401
export const me = (req: Request, res: Response) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
};
