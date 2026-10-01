import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useSite } from '../context/SiteContext';
import { useUI } from '../context/UIContext';
import { api, errorMessage } from '../services/api';
import { td, th } from '../components/AdminUI';
import StatusBadge from '../components/StatusBadge';
import { ErrorState, Loading } from '../components/States';
import { formatDate, telHref } from '../utils/format';
import type { Customer, Order } from '../types';

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch<{ user: Customer; orders: Order[] }>(`/customers/${id}`);
  const { money } = useSite();
  const { toast, confirm } = useUI();

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? 'Not found'} onRetry={reload} />;
  const { user: c, orders } = data;
  const spent = orders.filter((o) => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0);

  async function toggleStatus() {
    const next = c.status === 'active' ? 'blocked' : 'active';
    if (next === 'blocked' && !(await confirm({ title: `Block ${c.name}?`, message: 'They will be signed out and unable to sign in.', confirmText: 'Block', danger: true }))) return;
    try {
      await api.patch(`/customers/${c._id}`, { status: next });
      toast(next === 'blocked' ? 'Customer blocked' : 'Customer reactivated');
      reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  }

  return (
    <>
      <Link to="/customers" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ocean"><ArrowLeft className="size-4" /> All customers</Link>
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="card h-fit p-6">
          <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-ocean to-aqua text-xl font-bold text-white">{c.name[0]}</div>
          <h1 className="mt-4 text-xl font-bold">{c.name}</h1>
          <div className="mt-1"><StatusBadge status={c.status} /></div>
          <div className="mt-4 space-y-2 text-sm">
            <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-deep hover:text-ocean"><Mail className="size-4" /> {c.email}</a>
            {c.phone && <a href={telHref(c.phone)} className="flex items-center gap-2 text-deep hover:text-ocean"><Phone className="size-4" /> {c.phone}</a>}
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 text-sm">
            <div><dt className="text-muted">Orders</dt><dd className="text-lg font-bold">{orders.length}</dd></div>
            <div><dt className="text-muted">Spent</dt><dd className="text-lg font-bold">{money(spent)}</dd></div>
            <div className="col-span-2"><dt className="text-muted">Joined</dt><dd>{formatDate(c.createdAt)}</dd></div>
          </dl>
          <button className={`${c.status === 'active' ? 'btn-outline' : 'btn-primary'} btn-sm mt-5 w-full`} onClick={toggleStatus}>
            {c.status === 'active' ? 'Block account' : 'Reactivate account'}
          </button>
        </div>
        <div className="card overflow-hidden">
          <h2 className="border-b border-slate-100 px-5 py-4 font-semibold">Order history</h2>
          {orders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50"><tr><th className={th}>Order</th><th className={th}>Total</th><th className={th}>Status</th><th className={th}>Date</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td className={td}><Link to={`/orders/${o._id}`} className="font-semibold text-ocean">{o.orderNumber}</Link></td>
                      <td className={td}>{money(o.total)}</td>
                      <td className={td}><StatusBadge status={o.status} /></td>
                      <td className={`${td} text-muted`}>{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="p-8 text-center text-sm text-muted">No orders yet.</p>}
        </div>
      </div>
    </>
  );
}
