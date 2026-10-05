export function formatMoney(amount: number, currency = 'AED') {
  try {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export const formatDate = (d: string | Date, withTime = false) =>
  new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime && { hour: '2-digit', minute: '2-digit' }),
  });

export const telHref = (n: string) => `tel:${n.replace(/[^\d+]/g, '')}`;
// wa.me needs an international number; local UAE numbers (05X…) get the 971 prefix.
const intl = (n: string) => {
  const d = n.replace(/\D/g, '').replace(/^00/, '');
  return d.startsWith('0') ? `971${d.slice(1)}` : d;
};
/** Pre-filled text for the general "chat with us" WhatsApp buttons (Contact page + floating icon). */
export const WA_ENQUIRY = 'Hello MAI WADI, I would like to enquire about your drinking water products and delivery.';
export const waHref = (n: string, text = '') => `https://wa.me/${intl(n)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
export const isExternal = (url: string) => /^https?:\/\//.test(url);

/**
 * Cloudinary delivery transform: auto format/quality, capped width. Non-Cloudinary URLs are returned unchanged.
 * `trim` strips the plain studio border around a product photo so the whole can fills its frame (no cropping).
 */
export const cdnImage = (src: string | undefined, width: number, trim = false) =>
  src && src.includes('res.cloudinary.com/') && src.includes('/upload/')
    ? src.replace('/upload/', `/upload/${trim ? 'e_trim:10/' : ''}f_auto,q_auto,c_limit,w_${width}/`)
    : src;
