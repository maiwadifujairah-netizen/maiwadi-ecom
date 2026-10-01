import axios from 'axios';

/**
 * Backend base URL. Production always uses same-origin "/api": vercel.json proxies it to Render, so the
 * SameSite=Lax auth cookie is first-party. A cross-site URL (https://x.onrender.com) would log in, then get
 * 401 on every request because the browser never sends the cookie back. VITE_API_URL applies in dev only.
 */
export const API_URL: string = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '').replace(/(\/api)?$/, '/api')
  : '/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export const api = axios.create({ baseURL: API_URL, withCredentials: true });

/** Images stored by the backend (/uploads, /static) live on the API origin; Cloudinary URLs are absolute. */
export const mediaUrl = (src?: string) => (src && /^\/(uploads|static)\//.test(src) ? API_ORIGIN + src : src);

export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Unable to reach the server. Check your connection and try again.';
    return (err.response.data as { message?: string })?.message || fallback;
  }
  return fallback;
}
