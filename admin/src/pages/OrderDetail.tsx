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
import { CancelOrderDialog, FLOW, step } from '../components/OrderDialogs';
import type { Order } from '../types';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { data: o, setData, loading, error, reload } = useFetch<Order>(`/orders/${id}`);
  const { money } = useSite();
  const { toast, confirm } = useUI();
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (loading) return <Loading />;
  if (error || !o) return <ErrorState message={error ?? 'Order not found'} onRetry={reload} />;

  /** Every action returns the saved order from the database, which replaces what's on screen. */
  async function send(req: () => Promise<{ data: Order }>, done: string) {
    setBusy(true);
    try {
      const { data } = await req();
      setData({ ...data, user: o!.user });
      toast(done);
      setNote('');
      setStatus('');
      return true;
    } catch (e) {
      toast(errorMessage(e), 'error');
      return false;
    } finally {
      setBusy(false);
    }
  }
  const patch = (body: Record<string, string>, done = 'Order updated') => send(() => api.patch<Order>(`/orders/${o!._id}`, body), done);

  const a = o.address;
  // Cash on delivery is collected at the door: it can be marked paid once the order is delivered
  const codUnpaid = o.paymentMethod === 'cod' && o.paymentStatus === 'pending';
  const canCollect = codUnpaid && o.status === 'Delivered';

  const next = FLOW.filter((s) => step(s) === step(o.status) + 1); // one step at a time
  const final = o.status === 'Cancelled' || o.status === 'Delivered';

  async function collectCash() {
    if (await confirm({ title: 'Cash collected?', message: `Confirm you received ${money(o!.total)} in cash for ${o!.orderNumber}. The order will be marked Paid.`, confirmText: 'Mark as paid' }))
      send(() => api.post<Order>(`/orders/${o!._id}/collect-cash`), 'Cash collected — payment marked Paid');
  }

  async function markRefunded() {
    if (await confirm({ title: 'Mark as refunded?', message: `Record that ${money(o!.total)} was returned to the customer. Stock is not changed.`, confirmText: 'Mark refunded', danger: true }))
      patch({ paymentStatus: 'refunded', ...(note.trim() && { note }) }, 'Payment marked refunded');
  }
  const account = typeof o.user === 'object' && o.user ? o.user : null;

  return (
    <>
      <Link to="/orders" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ocean"><ArrowLeft className="size-4" /> All orders</Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{o.orderNumber}</h1>
        <StatusBadge status={o.status} />
        <StatusBadge status={o.paymentStatus} />
      </div>
      <dl className="card mb-6 grid gap-4 p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div><dt className="text-muted">Order placed (UAE time)</dt><dd className="mt-1 font-semibold">{formatDate(o.createdAt, true)}</dd></div>
        <div><dt className="text-muted">Payment method</dt><dd className="mt-1 font-semibold">{o.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online (Razorpay)'}</dd></div>
        <div><dt className="text-muted">Payment status</dt><dd className="mt-1"><StatusBadge status={o.paymentStatus} />{o.paidAt && <span className="block text-xs text-muted">Paid {formatDate(o.paidAt, true)}</span>}</dd></div>
        <div><dt className="text-muted">Order status</dt><dd className="mt-1"><StatusBadge status={o.status} /></dd></div>
      </dl>

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
                {a.line1}<br />{a.line2 && <>{a.line2}<br /></>}{a.area && `${a.area}, `}{a.city}{a.state && <><br />{a.state}{a.postalCode && ` ${a.postalCode}`}</>}
              </address>
              {a.notes && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Note: {a.notes}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {!final && (
            <div className="card space-y-4 p-5">
              <h2 className="font-semibold">Update status</h2>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Next status">
                <option value="">Move to…</option>
                {next.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input className="input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn-primary w-full" disabled={busy || !status} onClick={() => patch({ status, note })}>{busy && <Spinner className="size-4" />} Update status</button>
              <button className="btn-danger w-full" disabled={busy} onClick={() => setCancelling(true)}>Cancel order</button>
            </div>
          )}
          {o.status === 'Cancelled' && <p className="card bg-red-50 p-5 text-sm text-red-700">This order is cancelled. It can no longer be updated, delivered or paid.</p>}
          {o.status === 'Delivered' && (
            <div className="card space-y-3 p-5">
              <h2 className="font-semibold">Returns &amp; manual review</h2>
              <p className="text-xs text-muted">Delivered orders can't be cancelled and stock is not restored. Record a return or issue here for review.</p>
              <textarea className="input" rows={2} placeholder="e.g. Customer returned 1 can — damaged seal" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
              <button className="btn-outline w-full" disabled={busy || !note.trim()} onClick={() => patch({ note }, 'Note added to history')}>Add note to history</button>
              {o.paymentStatus === 'paid' && <button className="btn-danger w-full" disabled={busy} onClick={markRefunded}>Mark payment refunded</button>}
            </div>
          )}
          <div className="card space-y-3 p-5">
            <h2 className="font-semibold">Payment</h2>
            <p className="text-sm">{o.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online (Razorpay)'}</p>
            {codUnpaid && o.status !== 'Cancelled' && (
              <>
                <button className="btn-primary w-full" disabled={busy || !canCollect} onClick={collectCash}>{busy && <Spinner className="size-4" />} Mark cash collected</button>
                {!canCollect && <p className="text-xs text-muted">Available once the order is marked Delivered.</p>}
              </>
            )}
            <p className="text-sm">Status: <StatusBadge status={o.paymentStatus} /></p>
            {o.paymentMethod === 'razorpay' && (
              <dl className="space-y-1 text-xs">
                <div><dt className="inline text-muted">Razorpay order: </dt><dd className="inline font-mono break-all">{o.razorpayOrderId || '—'}</dd></div>
                <div><dt className="inline text-muted">Payment ID: </dt><dd className="inline font-mono break-all">{o.razorpayPaymentId || 'not paid yet'}</dd></div>
              </dl>
            )}
          </div>
          <div className="card p-5">
            <h2 className="font-semibold">History</h2>
            <ol className="mt-4 space-y-4 border-l-2 border-mist pl-4">
              {[...o.statusHistory].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute top-1.5 -left-[22px] size-2.5 rounded-full bg-ocean" />
                  <p className="text-sm font-semibold">{h.status === 'Shipped' ? 'Out for Delivery' : h.status}</p>
                  {h.note && <p className="text-sm text-muted">{h.note}</p>}
                  <p className="text-xs text-muted">{formatDate(h.at, true)}{h.by && ` · by ${h.by}`}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {cancelling && (
        <CancelOrderDialog order={o} onClose={() => setCancelling(false)} onConflict={() => { setCancelling(false); reload(); }}
          onSaved={(saved) => { setData({ ...saved, user: o.user }); setCancelling(false); }} />
      )}
    </>
  );
}
