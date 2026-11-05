export function formatMoney(amount: number, currency = 'AED') {
  try {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// Dates are shown in UAE time (Asia/Dubai) whatever the viewer's device timezone, e.g. "04 Nov 2026, 11:45 AM"
const UAE = { timeZone: 'Asia/Dubai' } as const;
const TIME = { hour: '2-digit', minute: '2-digit', hour12: true } as const;
const upperAmPm = (s: string) => s.replace(/\b(am|pm)\b/, (m) => m.toUpperCase());
export const formatDate = (d: string | Date, withTime = false) =>
  upperAmPm(new Date(d).toLocaleString('en-GB', { ...UAE, day: '2-digit', month: 'short', year: 'numeric', ...(withTime && TIME) }));
export const formatTime = (d: string | Date) => upperAmPm(new Date(d).toLocaleTimeString('en-GB', { ...UAE, ...TIME }));

export const telHref = (n: string) => `tel:${n.replace(/[^\d+]/g, '')}`;
// wa.me needs an international number; local UAE numbers (05X…) get the 971 prefix.
const intl = (n: string) => {
  const d = n.replace(/\D/g, '').replace(/^00/, '');
  return d.startsWith('0') ? `971${d.slice(1)}` : d;
};
export const waHref = (n: string, text = '') => `https://wa.me/${intl(n)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
export const isExternal = (url: string) => /^https?:\/\//.test(url);
