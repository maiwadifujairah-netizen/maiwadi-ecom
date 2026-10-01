import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const opts = { timestamps: true } as const;

// ---------- User (admins + registered customers) ----------
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer', index: true },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  },
  opts,
);
export const User = model('User', userSchema);
export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

// ---------- Category ----------
const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
  },
  opts,
);
export const Category = model('Category', categorySchema);

// ---------- Product ----------
const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true }, // availability on the storefront
    featured: { type: Boolean, default: true },
  },
  opts,
);
productSchema.index({ name: 'text', shortDescription: 'text' });
export const Product = model('Product', productSchema);

// ---------- Banner ----------
export const BANNER_POSITIONS = ['center', 'top', 'bottom', 'left', 'right'] as const;
const bannerSchema = new Schema(
  {
    // 'hero' = full-width homepage hero; 'promo' = promotional carousel. Older docs without it are promo.
    placement: { type: String, enum: ['hero', 'promo'], default: 'promo', index: true },
    title: { type: String, required: true, trim: true }, // also the image alt text
    subtitle: { type: String, default: '' },
    image: { type: String, required: true }, // desktop image (Cloudinary URL)
    mobileImage: { type: String, default: '' }, // optional; falls back to `image`
    desktopPosition: { type: String, enum: BANNER_POSITIONS, default: 'center' },
    mobilePosition: { type: String, enum: BANNER_POSITIONS, default: 'center' },
    showTitle: { type: Boolean, default: true },
    showSubtitle: { type: Boolean, default: true },
    showButtons: { type: Boolean, default: true },
    buttonText: { type: String, default: '' },
    buttonLink: { type: String, default: '' },
    secondaryButtonText: { type: String, default: '' },
    secondaryButtonLink: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  opts,
);
export const Banner = model('Banner', bannerSchema);

// ---------- Order ----------
export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      phone: { type: String, required: true },
    },
    address: {
      line1: { type: String, required: true },
      line2: { type: String, default: '' },
      city: { type: String, required: true },
      area: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: String,
        image: String,
        price: Number,
        quantity: Number,
        _id: false,
      },
    ],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'AED' },
    paymentMethod: { type: String, enum: ['cod', 'razorpay'], required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending', index: true },
    statusHistory: [{ status: String, note: String, at: { type: Date, default: Date.now }, _id: false }],
  },
  opts,
);
export const Order = model('Order', orderSchema);

// ---------- Contact inquiry ----------
const inquirySchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'read', 'resolved'], default: 'new', index: true },
  },
  opts,
);
export const Inquiry = model('Inquiry', inquirySchema);

// ---------- Site settings (singleton: editable brand content + contact + delivery fee) ----------
const settingsSchema = new Schema(
  {
    key: { type: String, default: 'site', unique: true },
    siteName: { type: String, default: 'MAI WADI' },
    tagline: { type: String, default: 'As pure as you' },
    currency: { type: String, default: 'AED' },
    deliveryFee: { type: Number, default: 0, min: 0 },
    phone: { type: String, default: '' },
    mobile: { type: String, default: '' },
    whatsapp: { type: String, default: '' }, // international digits only, e.g. 971509087560
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    workingHours: { type: String, default: '' },
    socials: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      x: { type: String, default: '' },
      tiktok: { type: String, default: '' },
    },
    heroTitle: { type: String, default: '' },
    heroSubtitle: { type: String, default: '' },
    features: { type: [{ title: String, text: String, _id: false }], default: [] },
    aboutIntro: { type: String, default: '' },
    aboutMission: { type: String, default: '' },
    aboutValues: { type: [{ title: String, text: String, _id: false }], default: [] },
    aboutDelivery: { type: String, default: '' },
  },
  opts,
);
export const Settings = model('Settings', settingsSchema);
