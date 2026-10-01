import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useSite } from '../context/SiteContext';
import { useUI } from '../context/UIContext';
import { api, errorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { WhatsAppIcon } from '../components/icons';
import { ErrorState, Img, Loading, Spinner } from '../components/States';
import { formatDate, telHref, waHref } from '../utils/format';
import { ORDER_STATUSES, type Order, type PaymentStatus } from '../types';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { data: o, setData, loading, error, reload } = useFetch<Order>(`/orders/${id}`);
  const { money } = useSite();
  const { toast, confirm } = useUI();
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error || !o) return <ErrorState message={error ?? 'Order not found'} onRetry={reload} />;

  async function patch(body: Record<string, string>) {
    setBusy(true);
    try {
      const { data } = await api.patch<Order>(`/orders/${o!._id}`, body);
      setData({ ...o!, ...data, user: o!.user });
      toast('Order updated');
      setNote('');
      setStatus('');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus() {
    if (!status || status === o!.status) return;
    if (status === 'Cancelled' && !(await confirm({ title: 'Cancel this order?', message: 'Stock will be returned to inventory. Cancelled orders cannot be reopened.', confirmText: 'Cancel order', danger: true }))) return;
    patch({ status, note });
  }

  const a = o.address;
  const account = typeof o.user === 'object' && o.user ? o.user : null;

  return (
    <>
      <Link to="/orders" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ocean"><ArrowLeft className="size-4" /> All orders</Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{o.orderNumber}</h1>
        <StatusBadge status={o.status} />
        <span className="text-sm text-muted">{formatDate(o.createdAt, true)}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <h2 className="border-b border-slate-100 px-5 py-4 font-semibold">Items</h2>
            <ul className="divide-y divide-slate-100">
              {o.items.map((i) => (
                <li key={i.product} className="flex items-center gap-4 px-5 py-4">
                  <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-mist"><Img src={i.image} alt="" className="size-full object-contain mix-blend-multiply" /></div>
                  <div className="flex-1"><p className="font-medium">{i.name}</p><p className="text-sm text-muted">{money(i.price)} × {i.quantity}</p></div>
                  <p className="font-semibold">{money(i.price * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 border-t border-slate-100 bg-slate-50 px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{money(o.deliveryFee)}</dd></div>
              <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{money(o.total)}</dd></div>
            </dl>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-5">
              <h2 className="font-semibold">Customer</h2>
              <p className="mt-3 font-medium">{o.customer.name}</p>
              <div className="mt-2 space-y-1.5 text-sm">
                <a href={telHref(o.customer.phone)} className="flex items-center gap-2 text-deep hover:text-ocean"><Phone className="size-4" /> {o.customer.phone}</a>
                <a href={waHref(o.customer.phone, `Hello ${o.customer.name}, regarding your MAI WADI order ${o.orderNumber}`)} target="_blank" rel="noopener" className="flex items-center gap-2 text-deep hover:text-ocean"><WhatsAppIcon className="size-4" /> WhatsApp</a>
                <a href={`mailto:${o.customer.email}`} className="flex items-center gap-2 text-deep hover:text-ocean"><Mail className="size-4" /> {o.customer.email}</a>
              </div>
              <p className="mt-3 text-xs text-muted">{account ? <>Registered customer · <Link className="text-ocean" to={`/customers/${account._id}`}>View profile</Link></> : 'Guest checkout'}</p>
            </div>
            <div className="card p-5">
              <h2 className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-ocean" /> Delivery address</h2>
              <address className="mt-3 text-sm leading-relaxed not-italic">
                {a.line1}<br />{a.line2 && <>{a.line2}<br /></>}{a.area && `${a.area}, `}{a.city}
              </address>
              {a.notes && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Note: {a.notes}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card space-y-4 p-5">
            <h2 className="font-semibold">Update status</h2>
            <select className="input" value={status || o.status} onChange={(e) => setStatus(e.target.value)} disabled={o.status === 'Cancelled'}>
              {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input className="input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} disabled={o.status === 'Cancelled'} />
            <button className="btn-primary w-full" disabled={busy || !status || status === o.status} onClick={updateStatus}>{busy && <Spinner className="size-4" />} Update status</button>
          </div>
          <div className="card space-y-3 p-5">
            <h2 className="font-semibold">Payment</h2>
            <p className="text-sm">{o.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online (Razorpay)'}</p>
            <select className="input" value={o.paymentStatus} onChange={(e) => patch({ paymentStatus: e.target.value as PaymentStatus })} disabled={busy}>
              {['pending', 'paid', 'failed', 'refunded'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold">History</h2>
            <ol className="mt-4 space-y-4 border-l-2 border-mist pl-4">
              {[...o.statusHistory].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute top-1.5 -left-[22px] size-2.5 rounded-full bg-ocean" />
                  <p className="text-sm font-semibold">{h.status}</p>
                  {h.note && <p className="text-sm text-muted">{h.note}</p>}
                  <p className="text-xs text-muted">{formatDate(h.at, true)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
