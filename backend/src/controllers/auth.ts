import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { env } from '../config/env.js';
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
  if (!user?.password || !(await bcrypt.compare(password, user.password))) throw new HttpError(401, 'Invalid email or password');
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

// ---------- Google Sign-In (Google Identity Services ID token) ----------
const googleClient = new OAuth2Client();

// Stub point for tests (like the payment `gateway`). Google's library checks signature, audience, issuer and expiry.
export const google = {
  async verify(idToken: string): Promise<TokenPayload | undefined> {
    return (await googleClient.verifyIdToken({ idToken, audience: env.googleClientId })).getPayload();
  },
};

// Google vouches for current ownership of Gmail and Workspace (hd) addresses only. Other addresses were verified once
// at Google sign-up, so they may create a new account but never take over an existing one.
const ownsEmail = (p: TokenPayload, email: string) => {
  const domain = email.split('@')[1];
  return domain === 'gmail.com' || domain === 'googlemail.com' || p.hd?.toLowerCase() === domain;
};

// Website: signs in or registers a customer. Admin app (X-App: admin): signs in existing admins only, never creates or promotes.
export const googleAuth = async (req: Request, res: Response) => {
  if (!env.googleClientId) throw new HttpError(503, 'Google sign-in is not available right now');
  const { credential } = z.object({ credential: z.string().min(1).max(4096) }).parse(req.body);
  const p = await google.verify(credential).catch(() => undefined);
  if (!p?.sub || !p.email) throw new HttpError(401, 'Google sign-in failed. Please try again.');
  if (p.email_verified !== true) throw new HttpError(401, 'Your Google email address is not verified');
  const email = p.email.toLowerCase();
  const adminApp = req.get('x-app') === 'admin';

  let user = (await User.findOne({ googleId: p.sub }).select('+googleId')) ?? (await User.findOne({ email }).select('+googleId'));
  if (adminApp && user?.role !== 'admin') throw new HttpError(403, 'This Google account does not have admin access');
  if (user?.status === 'blocked') throw new HttpError(403, 'This account has been disabled');

  let created = false;
  if (!user) {
    user = await User.create({ name: p.name?.trim().slice(0, 80) || email.split('@')[0], email, googleId: p.sub, role: 'customer' });
    created = true;
  } else if (user.googleId === undefined) {
    // Found by email: link this Google identity. Only the googleId is written; password and role stay as they are.
    if (!ownsEmail(p, email)) throw new HttpError(409, 'An account with this email already exists. Please sign in with your email and password.');
    user = await User.findOneAndUpdate({ _id: user._id, googleId: { $exists: false } }, { $set: { googleId: p.sub } }, { returnDocument: 'after' });
    if (!user) throw new HttpError(409, 'Please try signing in again');
  } else if (user.googleId !== p.sub) {
    throw new HttpError(409, 'This email is linked to a different Google account');
  }

  setAuthCookie(res, String(user._id));
  res.status(created ? 201 : 200).json({ user: publicUser(user) });
};
