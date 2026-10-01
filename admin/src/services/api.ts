import axios from 'axios';

/** Backend base URL, e.g. http://localhost:5000/api — or "/api" when a host rewrite proxies it (see README). */
export const API_URL: string = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
/** Customer website, for "View website" links. */
export const SITE_URL: string = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';

const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

// X-App keeps the admin session in its own cookie, separate from a customer session on the website
export const api = axios.create({ baseURL: API_URL, withCredentials: true, headers: { 'X-App': 'admin' } });

/** Images stored by the backend (/uploads, /static) live on the API origin; Cloudinary URLs are absolute. */
export const mediaUrl = (src?: string) => (src && /^\/(uploads|static)\//.test(src) ? API_ORIGIN + src : src);

export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Unable to reach the server. Check your connection and try again.';
    return (err.response.data as { message?: string })?.message || fallback;
  }
  return fallback;
}

export async function uploadImage(file: File, folder: 'products' | 'banners'): Promise<string> {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post<{ url: string }>(`/uploads?folder=${folder}`, form);
  return data.url;
}
