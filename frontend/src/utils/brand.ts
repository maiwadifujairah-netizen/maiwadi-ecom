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
 * Section images, one per purpose (files in public/images/<purpose>/). Product cards take the can from Admin → Products,
 * and banners come only from Admin → Banners.
 */
export const FACTORY_IMAGE = '/images/factory/production-line.webp'; // Home → Why choose MAI WADI? (filling line with labelled cans, 1536×1024)
export const FACILITY_FLOOR_IMAGE = '/images/factory/facility-line.webp'; // About → Our facility: filling line with labelled cans (1082×796)
export const FILLING_LINE_IMAGE = '/images/factory/filling-line.jpg'; // MAI WADI cans on the filling line
export const DELIVERY_IMAGE = '/images/delivery/truck.jpg'; // MAI WADI truck, landscape
export const DELIVERY_SCENE_IMAGE = '/images/delivery/truck-numbers.webp'; // 16:9 crop of truck.jpg showing the phone numbers, 1280×720 (Reliable delivery card)
export const DELIVERY_BANNER_IMAGE = '/images/delivery/delivery-scene.webp'; // worker + truck at the warehouse, 864×678 (Delivery section, Home & About)
/** Inner-page hero scene (About, Products, Contact): 18.9L can, splash, sea and mountains. */
export const WATER_HERO = { src: '/images/about/hero-water.webp', alt: 'MAI WADI 18.9L water can with water splashing by the sea and mountains', width: 1236, height: 514 };
export const MISSION_IMAGE = '/images/about/mission-drop.webp'; // MAI WADI water drop (About → Our mission, 716×656)
export const CAN_IMAGE = '/images/products/water-can.webp'; // official 18.9L can with the Dial Us On numbers, 1024×1535
export const ABOUT_IMAGE = CAN_IMAGE; // About → "Who we are"
export const SUPPLY_IMAGE = FACTORY_IMAGE; // Products → Business supply banner (same filling-line photo)

/** Official contact number; overrides Admin → Settings phone/mobile/WhatsApp everywhere on the site. */
export const OFFICIAL_PHONE = '+971 50 383 9976';
export const OFFICIAL_WHATSAPP = '971503839976';

