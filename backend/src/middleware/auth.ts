import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, type UserDoc } from '../models/index.js';
import { HttpError } from '../utils/http.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserDoc;
    }
  }
}

// Separate sessions for the two apps: they share a cookie jar on localhost (ports are ignored),
// so the admin app sends `X-App: admin` and gets its own cookie. The header only picks which cookie to read.
const cookieName = (req: Request) => (req.get('x-app') === 'admin' ? 'mw_admin_token' : 'mw_token');
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res: Response, userId: string) {
  const name = cookieName(res.req);
  const token = jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: '7d' });
  res.cookie(name, token, {
    httpOnly: true,
    secure: env.isProd || env.cookieSameSite === 'none',
    sameSite: env.cookieSameSite,
    maxAge: MAX_AGE,
    path: '/',
  });
}

export const clearAuthCookie = (res: Response) =>
  res.clearCookie(cookieName(res.req), { httpOnly: true, secure: env.isProd || env.cookieSameSite === 'none', sameSite: env.cookieSameSite, path: '/' });

async function loadUser(req: Request) {
  const token = req.cookies?.[cookieName(req)];
  if (!token) return null;
  try {
    const { sub } = jwt.verify(token, env.jwtSecret) as { sub: string };
    const user = await User.findById(sub).lean<UserDoc>();
    return user && user.status === 'active' ? user : null;
  } catch {
    return null;
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  req.user = (await loadUser(req)) ?? undefined;
  next();
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user = await loadUser(req);
  if (!user) throw new HttpError(401, 'Please sign in to continue');
  req.user = user;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {});
  if (req.user?.role !== 'admin') throw new HttpError(403, 'Admin access required');
  next();
}
