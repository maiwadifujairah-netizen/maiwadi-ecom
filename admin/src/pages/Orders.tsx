import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useDebounced } from '../hooks/useDebounced';
import { useSite } from '../context/SiteContext';
import { AdminHeader, td, th } from '../components/AdminUI';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { formatDate } from '../utils/format';
import { ORDER_STATUSES, type Order, type Paged } from '../types';

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const payment = params.get('payment') ?? '';
  const page = Number(params.get('page')) || 1;
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const { data, loading, error, reload } = useFetch<Paged<Order>>(`/orders?page=${page}&status=${status}&paymentStatus=${payment}&search=${encodeURIComponent(q)}`);
  const { money } = useSite();

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
        <div className="flex gap-3">
        <label className="shrink-0">
          <span className="sr-only">Payment status</span>
          <select className="input" value={payment} onChange={(e) => setParam('payment', e.target.value)}>
            <option value="">All payments</option>
            {['pending', 'paid', 'failed', 'refunded'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        </label>
        <label className="relative flex-1 lg:w-72">
          <span className="sr-only">Search orders</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Order #, name, email, phone, payment ID…" value={search} onChange={(e) => { setSearch(e.target.value); setParam('page', ''); }} />
        </label>
        </div>
      </div>
      <div className="card overflow-hidden">
        {loading && !data ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} />
          : !data?.items.length ? <EmptyState title="No orders found" />
          : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50"><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Items</th><th className={th}>Total</th><th className={th}>Payment</th><th className={th}>Status</th><th className={th}>Date</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50">
                      <td className={td}><Link to={`/orders/${o._id}`} className="font-semibold whitespace-nowrap text-ocean">{o.orderNumber}</Link></td>
                      <td className={td}><p className="font-medium">{o.customer.name}</p><p className="text-xs text-muted">{o.customer.phone}</p></td>
                      <td className={`${td} text-muted`}>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                      <td className={`${td} font-semibold whitespace-nowrap`}>{money(o.total)}</td>
                      <td className={td}><span className="text-xs text-muted uppercase">{o.paymentMethod}</span> <StatusBadge status={o.paymentStatus} /></td>
                      <td className={td}><StatusBadge status={o.status} /></td>
                      <td className={`${td} whitespace-nowrap text-muted`}>{formatDate(o.createdAt, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
      {data && <Pagination page={data.page} pages={data.pages} onChange={(p) => setParam('page', String(p))} />}
    </>
  );
}
