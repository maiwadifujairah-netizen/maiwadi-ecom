import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, Eye, Search } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useDebounced } from '../hooks/useDebounced';
import { useSite } from '../context/SiteContext';
import { AdminHeader, td as baseTd, th as baseTh } from '../components/AdminUI';

// Tighter cells + wrapping headers so all 9 columns fit beside the sidebar on a laptop screen
const td = baseTd.replace('px-4', 'px-3');
const th = baseTh.replace('px-4', 'px-3');
import Pagination from '../components/Pagination';
import StatusBadge, { COLORS } from '../components/StatusBadge';
import { CancelOrderDialog, FLOW, StatusChangeDialog, nextStatus } from '../components/OrderDialogs';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { formatDate, formatTime } from '../utils/format';
import { ORDER_STATUSES, PAYMENT_STATUSES, type Order, type Paged } from '../types';

const label = (s: string) => (s === 'pending' ? 'Pending / Unpaid' : s[0].toUpperCase() + s.slice(1));

/**
 * Order Status cell: the current status (badge colours) as the selected value; of the other steps only the next is enabled.
 * Delivered / Cancelled are read-only. Picking only opens a confirmation dialog, and it never touches payment.
 */
function StatusSelect({ order, onPick }: { order: Order; onPick: (next: string) => void }) {
  const current = order.status === 'Shipped' ? 'Out for Delivery' : order.status;
  const next = nextStatus(order.status);
  return (
    <label className="relative inline-flex">
      <span className="sr-only">Order status of {order.orderNumber}</span>
      <select value={current} disabled={!next} onChange={(e) => e.target.value !== current && onPick(e.target.value)}
        className={`appearance-none rounded-full py-1 pl-2.5 text-xs font-semibold ring-1 ring-current/15 focus:ring-2 focus:ring-ocean focus:outline-none ${COLORS[current] ?? ''} ${next ? 'cursor-pointer pr-7 hover:ring-current/40' : 'cursor-default pr-2.5 opacity-100'}`}>
        {/* All six statuses are listed. Selectable: the next step, and Cancelled (opens the reason dialog) while the
            order isn't Delivered. The backend enforces the same rules. */}
        {current === 'Cancelled' ? <option value={current}>Cancelled</option> : (
          <>
            {FLOW.map((s) => <option key={s} value={s} disabled={s !== current && s !== next}>{s}</option>)}
            <option value="Cancelled" disabled={!next}>Cancelled</option>
          </>
        )}
      </select>
      {next && <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2" />}
    </label>
  );
}

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const payment = params.get('payment') ?? '';
  const method = params.get('method') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const hideCompleted = params.get('hide') === '1';
  const page = Number(params.get('page')) || 1;
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [action, setAction] = useState<{ order: Order; status: string } | null>(null);
  const { data, loading, error, reload } = useFetch<Paged<Order>>(`/orders?page=${page}&status=${encodeURIComponent(status)}&paymentStatus=${payment}&paymentMethod=${method}&from=${from}&to=${to}${hideCompleted ? '&hideCompleted=1' : ''}&search=${encodeURIComponent(q)}`);
  const { money } = useSite();

  // After a save (or a 409 conflict) reload the page of orders from the database
  const refresh = () => { setAction(null); reload(); };

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next);
  };

  return (
    <>
      <AdminHeader title="Orders" text="Track and update every customer order." />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {['', ...ORDER_STATUSES].map((s) => (
            <button key={s} onClick={() => setParam('status', s)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${status === s ? 'bg-ocean text-white' : 'bg-white text-ink/70 ring-1 ring-slate-200 hover:ring-ocean'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <label className="relative lg:w-80">
          <span className="sr-only">Search orders</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Order ID, customer name, phone, email…" value={search} onChange={(e) => { setSearch(e.target.value); setParam('page', ''); }} />
        </label>
      </div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-muted">
          Payment status
          <select className="input mt-1" value={payment} onChange={(e) => setParam('payment', e.target.value)}>
            <option value="">All</option>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-muted">
          Payment method
          <select className="input mt-1" value={method} onChange={(e) => setParam('method', e.target.value)}>
            <option value="">All</option>
            <option value="cod">Cash on Delivery</option>
            <option value="razorpay">Online (Razorpay)</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-muted">
          Order date from
          <input type="date" className="input mt-1" value={from} max={to || undefined} onChange={(e) => setParam('from', e.target.value)} />
        </label>
        <label className="text-xs font-semibold text-muted">
          to
          <input type="date" className="input mt-1" value={to} min={from || undefined} onChange={(e) => setParam('to', e.target.value)} />
        </label>
        <label className="flex items-center gap-2 self-center pt-4 text-sm text-ink" title="Cancelled orders and delivered orders that are already paid are hidden from this list. Nothing is deleted.">
          <input type="checkbox" className="accent-ocean" checked={hideCompleted} onChange={(e) => setParam('hide', e.target.checked ? '1' : '')} />
          Hide completed orders
        </label>
        {(payment || method || from || to || hideCompleted) && (
          <button className="btn-outline btn-sm" onClick={() => setParams(new URLSearchParams(status ? { status } : {}))}>Clear filters</button>
        )}
      </div>
      <p className="mb-2 text-xs text-muted">Newest orders first · dates and times in UAE time (GST)</p>
      <div className="card overflow-hidden">
        {loading && !data ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} />
          : !data?.items.length ? <EmptyState title="No orders found" />
          : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50"><tr>{['Order ID', 'Customer Name', 'Phone Number', 'Order Date', 'Order Time', 'Total Amount', 'Payment Method', 'Payment Status', 'Order Status'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50">
                      <td className={td}>
                        <Link to={`/orders/${o._id}`} className="inline-flex items-center gap-1.5 font-semibold whitespace-nowrap text-ocean hover:underline" title="Open order details">
                          {o.orderNumber} <Eye className="size-3.5 opacity-70" aria-hidden="true" />
                        </Link>
                      </td>
                      <td className={`${td} font-medium`}>{o.customer.name}</td>
                      <td className={`${td} whitespace-nowrap text-muted`}>{o.customer.phone}</td>
                      <td className={`${td} whitespace-nowrap`}>{formatDate(o.createdAt)}</td>
                      <td className={`${td} whitespace-nowrap text-muted`}>{formatTime(o.createdAt)}</td>
                      <td className={`${td} font-semibold whitespace-nowrap`}>{money(o.total)}</td>
                      <td className={`${td} whitespace-nowrap`}>{o.paymentMethod === 'cod' ? 'COD' : 'Online'}</td>
                      <td className={`${td} whitespace-nowrap`}><StatusBadge status={o.paymentStatus} /></td>
                      <td className={`${td} whitespace-nowrap`}><StatusSelect order={o} onPick={(status) => setAction({ order: o, status })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
      {action?.status === 'Cancelled' && <CancelOrderDialog order={action.order} onClose={() => setAction(null)} onSaved={refresh} onConflict={refresh} />}
      {action && action.status !== 'Cancelled' && <StatusChangeDialog order={action.order} status={action.status} onClose={() => setAction(null)} onSaved={refresh} onConflict={refresh} />}
      {data && <Pagination page={data.page} pages={data.pages} onChange={(p) => setParam('page', String(p))} />}
    </>
  );
}
