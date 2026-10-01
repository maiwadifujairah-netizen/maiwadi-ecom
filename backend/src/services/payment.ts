import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env, razorpayEnabled } from '../config/env.js';

const razorpay = razorpayEnabled ? new Razorpay({ key_id: env.razorpay.keyId!, key_secret: env.razorpay.keySecret! }) : null;

export const paymentMethods = () => (razorpayEnabled ? ['cod', 'razorpay'] : ['cod']);
export const onlinePaymentEnabled = () => razorpayEnabled;

export interface GatewayPayment { id: string; order_id: string; status: string; amount: number | string; currency: string }

/** Razorpay API calls, kept on one object so tests can stand in for the network. */
export const gateway = {
  createOrder: (amount: number, currency: string, receipt: string) =>
    razorpay!.orders.create({ amount, currency, receipt }) as Promise<{ id: string; amount: number | string }>,
  fetchPayment: (paymentId: string) => razorpay!.payments.fetch(paymentId) as Promise<GatewayPayment>,
  orderPayments: async (razorpayOrderId: string) => ((await razorpay!.orders.fetchPayments(razorpayOrderId)).items ?? []) as GatewayPayment[],
  capture: (paymentId: string, amount: number, currency: string) => razorpay!.payments.capture(paymentId, amount, currency) as Promise<GatewayPayment>,
};

/** Amount in the smallest currency unit (fils/paise), as Razorpay expects. */
export const toMinor = (total: number) => Math.round(total * 100);

export async function createPaymentOrder(total: number, currency: string, receipt: string) {
  const rp = await gateway.createOrder(toMinor(total), currency, receipt);
  return { razorpayOrderId: rp.id };
}

/** Razorpay signature check: proves the callback came from Razorpay for this order. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac('sha256', env.razorpay.keySecret!).update(`${orderId}|${paymentId}`).digest('hex');
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
