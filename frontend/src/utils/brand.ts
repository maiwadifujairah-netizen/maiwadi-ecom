// Brand facts and customers taken from the official MAI WADI brochure. Edit here when they change.

/** Brand-level (apply to every MAI WADI product); product specifics like capacity belong in the product description. */
export const HIGHLIGHTS = [
  'Low sodium',
  'Advanced purification',
  'Meets UAE.S/GSO standards',
  'Delivered across Fujairah',
];

/** Customer logos from the brochure's "Our Customers" panel (files in public/images/customers). */
export const CUSTOMERS = [
  { name: 'ADNOC', logo: '/images/customers/adnoc.webp', width: 538, height: 221 },
  { name: 'Fujairah General Trading Enterprises (FGT)', logo: '/images/customers/fgt.webp', width: 286, height: 156 },
  { name: 'Safari Transport', logo: '/images/customers/safari-transport.webp', width: 537, height: 538 },
  { name: 'Eminence Private School', logo: '/images/customers/eminence.webp', width: 430, height: 238 },
  { name: 'Sahara Emirates', logo: '/images/customers/sahara-emirates.webp', width: 400, height: 336 },
  { name: 'Al Hilal Business Tower', logo: '/images/customers/al-hilal.webp', width: 304, height: 492 },
];

/** The real MAI WADI water can (transparent background). Product photos themselves are managed in Admin → Products. */
export const CAN_IMAGE = '/images/water-can.webp';

/** Official contact number; overrides Admin → Settings phone/mobile/WhatsApp everywhere on the site. */
export const OFFICIAL_PHONE = '+971 50 383 9976';
export const OFFICIAL_WHATSAPP = '971503839976';

