import { useEffect } from 'react';

/** Sets the page <title> and meta description for SEO. */
export function useMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | MAI WADI` : 'MAI WADI — Pure Drinking Water Delivered';
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [title, description]);
}
