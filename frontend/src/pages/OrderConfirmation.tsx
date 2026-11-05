import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';
import { useSite } from '../context/SiteContext';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/format';
import type { Order } from '../types';

export default function OrderConfirmation() {
  useMeta('Order confirmed');
  const { orderNumber } = useParams();
  const order = (useLocation().state as { order?: Order } | null)?.order;
  const { money, settings } = useSite();

  return (
    <div className="container-x max-w-2xl py-16 text-center">
      <CheckCircle2 className="mx-auto size-16 text-emerald-500" />
      <h1 className="mt-5 text-4xl font-bold">Thank you for your order!</h1>
      <p className="mt-3 text-muted">Order number <span className="font-semibold text-ink">{orderNumber}</span>. We'll contact you to confirm delivery.</p>
      {order && (
        <div className="card mt-8 p-6 text-left">
          <dl className="grid gap-3 border-b border-slate-100 pb-4 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Order ID</dt><dd className="font-semibold">{order.orderNumber}</dd></div>
            <div><dt className="text-muted">Order date &amp; time (UAE)</dt><dd className="font-semibold">{formatDate(order.createdAt, true)}</dd></div>
            <div><dt className="text-muted">Payment method</dt><dd className="font-semibold">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'}</dd></div>
            <div className="flex gap-6">
              <div><dt className="text-muted">Payment status</dt><dd className="mt-0.5"><StatusBadge status={order.paymentStatus} /></dd></div>
              <div><dt className="text-muted">Order status</dt><dd className="mt-0.5"><StatusBadge status={order.status} /></dd></div>
            </div>
          </dl>
          <ul className="mt-4 space-y-2 text-sm">
            {order.items.map((i) => (
              <li key={i.product} className="flex justify-between gap-3"><span>{i.name} <span className="text-muted">{money(i.price)} × {i.quantity}</span></span><span className="font-semibold">{money(i.price * i.quantity)}</span></li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery charge</dt><dd>{order.deliveryFee > 0 ? money(order.deliveryFee) : 'Free'}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
          </dl>
          {order.paymentMethod === 'cod' && order.paymentStatus !== 'paid' && <p className="mt-4 rounded-xl bg-mist p-3 text-sm">Please keep <strong>{money(order.total)}</strong> ready in cash for the delivery.</p>}
          <p className="mt-4 text-sm text-muted">Delivering to: {order.address.line1}{order.address.line2 && `, ${order.address.line2}`}, {order.address.area && `${order.address.area}, `}{order.address.city}{order.address.state && `, ${order.address.state}`}{order.address.postalCode && ` ${order.address.postalCode}`}</p>
        </div>
      )}
      {settings.mobile && <p className="mt-6 text-sm text-muted">Questions? Call us on <a className="font-semibold text-ocean" href={`tel:${settings.mobile.replace(/\s/g, '')}`}>{settings.mobile}</a></p>}
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/products" className="btn-primary">Continue shopping</Link>
        <Link to="/account" className="btn-outline">My orders</Link>
      </div>
    </div>
  );
}
