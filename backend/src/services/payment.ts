import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env, razorpayEnabled } from '../config/env.js';

const razorpay = razorpayEnabled ? new Razorpay({ key_id: env.razorpay.keyId!, key_secret: env.razorpay.keySecret! }) : null;

export const paymentMethods = () => (razorpay ? ['cod', 'razorpay'] : ['cod']);
export const onlinePaymentEnabled = () => Boolean(razorpay);

export async function createPaymentOrder(total: number, currency: string, receipt: string) {
  const rp = await razorpay!.orders.create({ amount: Math.round(total * 100), currency, receipt });
  return { keyId: env.razorpay.keyId, razorpayOrderId: rp.id, amount: rp.amount, currency };
}

/** Razorpay signature check — the only way an order becomes "paid". */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac('sha256', env.razorpay.keySecret!).update(`${orderId}|${paymentId}`).digest('hex');
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
