// Seeds: site settings (contact details from the delivery truck), the default category,
// the initial water-can product, and the admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
// Safe to re-run: existing records are left untouched.
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import { Category, Product, Settings, User } from './models/index.js';

export async function seed() {
  if (!(await Settings.exists({ key: 'site' }))) {
    await Settings.create({
      key: 'site',
      siteName: 'MAI WADI',
      tagline: 'As pure as you',
      currency: 'AED',
      deliveryFee: 0,
      phone: '09 277 8993',
      mobile: '050 908 7560',
      whatsapp: '971509087560',
      heroTitle: 'Pure drinking water, delivered to your door',
      heroSubtitle: 'MAI WADI purified drinking water in convenient water cans — order online and we bring it straight to your home or office.',
      features: [
        { title: 'Purified drinking water', text: 'Clean, refreshing water prepared for everyday drinking at home and at work.' },
        { title: 'Low sodium', text: 'A light, clean taste your whole family can enjoy every day.' },
        { title: 'Reliable delivery', text: 'Our own delivery fleet brings your water cans right to your doorstep.' },
        { title: 'Easy ordering', text: 'Order online in a few taps, or simply call or WhatsApp our team.' },
      ],
      aboutIntro: 'MAI WADI is a drinking water brand built on a simple promise: water as pure as you. We supply purified drinking water in water cans to homes and businesses, backed by our own delivery team.',
      aboutMission: 'To make clean, great-tasting drinking water easy to get — with honest service, dependable delivery and care in every can.',
      aboutValues: [
        { title: 'Purity', text: 'Quality comes first in every can we fill.' },
        { title: 'Reliability', text: 'Deliveries you can plan your week around.' },
        { title: 'Care', text: 'Friendly service from order to doorstep.' },
      ],
      aboutDelivery: 'Place your order online or call us, and our delivery team will bring your water cans to your home or office. Contact us for delivery areas and regular supply for businesses.',
    });
    console.log('✓ Settings created');
  }

  const category =
    (await Category.findOne({ slug: 'water-cans' })) ??
    (await Category.create({ name: 'Water Cans', slug: 'water-cans', description: 'Large-format drinking water cans for home and office dispensers.' }));

  if (!(await Product.exists({}))) {
    await Product.create({
      name: 'MAI WADI Water Can',
      slug: 'mai-wadi-water-can',
      shortDescription: 'Purified drinking water in a reusable water can, ideal for home and office dispensers.',
      description:
        'MAI WADI purified drinking water in a sturdy, reusable water can designed for standard water dispensers.\n\nPerfect for homes, offices and businesses that need a steady supply of clean drinking water, delivered to the door by our own team.',
      images: ['/static/water-can.webp'], // served by this API, so frontend and admin can both load it
      // Real price/stock are set by the admin in the dashboard — never invented here.
      price: Number(process.env.SEED_PRODUCT_PRICE ?? 0),
      stock: Number(process.env.SEED_PRODUCT_STOCK ?? 0),
      category: category._id,
      isActive: true,
      featured: true,
    });
    console.log('✓ Initial product created (set its price & stock in Admin → Products)');
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    if (ADMIN_PASSWORD.length < 10) throw new Error('ADMIN_PASSWORD must be at least 10 characters');
    const email = ADMIN_EMAIL.toLowerCase();
    if (!(await User.exists({ email }))) {
      await User.create({ name: ADMIN_NAME || 'Admin', email, role: 'admin', password: await bcrypt.hash(ADMIN_PASSWORD, 12) });
      console.log(`✓ Admin created: ${email}`);
    }
  } else {
    console.log('! ADMIN_EMAIL / ADMIN_PASSWORD not set — admin account not created');
  }
}

if (process.argv[1]?.match(/seed\.(ts|js)$/)) {
  await connectDB();
  await seed();
  await mongoose.disconnect();
}
