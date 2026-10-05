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

/**
 * Section images, one per purpose (files in public/images/<purpose>/). Product photos never appear here:
 * the water can comes only from Admin → Products, and banners only from Admin → Banners.
 */
export const FACTORY_IMAGE = '/images/factory/production-line.jpg'; // Home → Why choose MAI WADI?
export const FACILITY_FLOOR_IMAGE = '/images/factory/facility-line.webp'; // About → Our facility (720×554)
export const FILLING_LINE_IMAGE = '/images/factory/filling-line.jpg'; // MAI WADI cans on the filling line
export const DELIVERY_IMAGE = '/images/delivery/truck.jpg'; // MAI WADI truck, landscape
export const DELIVERY_SCENE_IMAGE = '/images/delivery/truck-scene.webp'; // truck on a Fujairah road, 1150×416 (delivery banner + card)
/** Same truck, lossless re-export + mild unsharp; the @2x (Lanczos) file serves high-density screens. */
export const DELIVERY_SCENE_SRCSET = `${DELIVERY_SCENE_IMAGE} 1150w, /images/delivery/truck-scene@2x.webp 2300w`;
export const DELIVERY_BANNER_IMAGE = '/images/delivery/delivery-scene.webp'; // worker + truck at the warehouse (Delivery section, Home & About)
export const SUPPLY_IMAGE = '/images/delivery/supply-scene.webp'; // worker loading cans beside the truck (Products → regular supply)
export const MISSION_IMAGE = '/images/about/mission-drop.webp'; // MAI WADI water drop (About → Our mission, 716×656)
export const DELIVERY_PORTRAIT_IMAGE = '/images/delivery/truck-full.jpg'; // same truck, portrait
export const ABOUT_IMAGE = DELIVERY_PORTRAIT_IMAGE; // "Who we are": the company's own fleet (no separate about photo yet)

/** Official contact number; overrides Admin → Settings phone/mobile/WhatsApp everywhere on the site. */
export const OFFICIAL_PHONE = '+971 50 383 9976';
export const OFFICIAL_WHATSAPP = '971503839976';

