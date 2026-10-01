import axios from 'axios';

/** Backend base URL, e.g. http://localhost:5000/api — or "/api" when a host rewrite proxies it (see README). */
// Always ends in /api: routes are mounted under /api, so a bare origin (https://x.onrender.com) would 404
export const API_URL: string = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api'))
  .replace(/\/+$/, '')
  .replace(/(\/api)?$/, '/api');
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
