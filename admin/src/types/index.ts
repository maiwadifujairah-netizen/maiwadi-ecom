export interface Category { _id: string; name: string; slug: string; description?: string; productCount?: number }

export interface Product {
  _id: string; name: string; slug: string; shortDescription: string; description: string;
  images: string[]; price: number; stock: number; category: Pick<Category, '_id' | 'name' | 'slug'> | null;
  isActive: boolean; featured: boolean; createdAt: string;
}

export const BANNER_POSITIONS = ['center', 'top', 'bottom', 'left', 'right'] as const;
export type BannerPosition = (typeof BANNER_POSITIONS)[number];

export interface Banner {
  _id: string; placement?: 'hero' | 'promo'; title: string; subtitle: string;
  image: string; mobileImage?: string; desktopPosition?: BannerPosition; mobilePosition?: BannerPosition;
  showTitle?: boolean; showSubtitle?: boolean; showButtons?: boolean;
  buttonText: string; buttonLink: string; secondaryButtonText?: string; secondaryButtonLink?: string;
  isActive: boolean; order: number;
}

export interface Block { title: string; text: string }

export interface Settings {
  siteName: string; tagline: string; currency: string; deliveryFee: number;
  phone: string; mobile: string; whatsapp: string; email: string; address: string; workingHours: string;
  socials: { facebook: string; instagram: string; x: string; tiktok: string };
  heroTitle: string; heroSubtitle: string; features: Block[];
  aboutIntro: string; aboutMission: string; aboutValues: Block[]; aboutDelivery: string;
}

export interface User { id: string; name: string; email: string; phone: string; role: 'customer' | 'admin' }

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  _id: string; orderNumber: string; createdAt: string;
  user?: { _id: string; name: string; email: string; phone: string } | string | null;
  customer: { name: string; email: string; phone: string };
  address: { line1: string; line2: string; city: string; area: string; notes: string };
  items: { product: string; name: string; image: string; price: number; quantity: number }[];
  subtotal: number; deliveryFee: number; total: number; currency: string;
  paymentMethod: 'cod' | 'razorpay'; paymentStatus: PaymentStatus;
  status: OrderStatus; statusHistory: { status: string; note: string; at: string }[];
}

export interface Inquiry { _id: string; name: string; email: string; phone: string; message: string; status: 'new' | 'read' | 'resolved'; createdAt: string }

export interface Customer { _id: string; name: string; email: string; phone: string; status: 'active' | 'blocked'; createdAt: string; orders?: number; spent?: number }

export interface Paged<T> { items: T[]; total: number; page: number; pages: number }
