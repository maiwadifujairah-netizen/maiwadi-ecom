import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, DollarSign, Mail, Package, ShoppingBag, Users } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useSite } from '../context/SiteContext';
import { AdminHeader, td, th } from '../components/AdminUI';
import StatusBadge from '../components/StatusBadge';
import { ErrorState, Loading } from '../components/States';
import { formatDate } from '../utils/format';
import type { Order } from '../types';

interface Stats {
  products: number; orders: number; pending: number; completed: number; customers: number; newInquiries: number;
  lowStock: { _id: string; name: string; stock: number }[];
  recent: Pick<Order, '_id' | 'orderNumber' | 'customer' | 'total' | 'status' | 'createdAt'>[];
  sales: { total: number; orders: number }; sales30: { total: number; orders: number };
}

export default function Dashboard() {
  const { data: s, loading, error, reload } = useFetch<Stats>('/admin/dashboard');
  const { money } = useSite();
  if (loading) return <Loading />;
  if (error || !s) return <ErrorState message={error ?? 'Failed to load'} onRetry={reload} />;

  const cards = [
    { label: 'Total sales', value: money(s.sales.total), sub: `${s.sales.orders} non-cancelled orders`, icon: DollarSign, to: '/orders' },
    { label: 'Last 30 days', value: money(s.sales30.total), sub: `${s.sales30.orders} orders`, icon: DollarSign, to: '/orders' },
    { label: 'Total orders', value: s.orders, icon: ShoppingBag, to: '/orders' },
    { label: 'Pending orders', value: s.pending, icon: Clock, to: '/orders?status=Pending' },
    { label: 'Completed orders', value: s.completed, sub: 'Delivered', icon: CheckCircle2, to: '/orders?status=Delivered' },
    { label: 'Products', value: s.products, icon: Package, to: '/products' },
    { label: 'Customers', value: s.customers, sub: 'Registered accounts', icon: Users, to: '/customers' },
    { label: 'New inquiries', value: s.newInquiries, icon: Mail, to: '/inquiries' },
  ];

  return (
    <>
      <AdminHeader title="Dashboard" text="Live overview of your store." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="card flex items-start justify-between p-5 transition hover:shadow-md">
            <div>
              <p className="text-sm text-muted">{c.label}</p>
              <p className="mt-2 font-display text-2xl font-bold">{c.value}</p>
              {c.sub && <p className="mt-1 text-xs text-muted">{c.sub}</p>}
            </div>
            <div className="grid size-10 place-items-center rounded-xl bg-mist text-ocean"><c.icon className="size-5" /></div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold">Recent orders</h2>
            <Link to="/orders" className="text-sm font-semibold text-ocean">View all</Link>
          </div>
          {s.recent.length ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50"><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Total</th><th className={th}>Status</th><th className={th}>Date</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {s.recent.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50">
                      <td className={td}><Link to={`/orders/${o._id}`} className="font-semibold text-ocean">{o.orderNumber}</Link></td>
                      <td className={td}>{o.customer.name}</td>
                      <td className={td}>{money(o.total)}</td>
                      <td className={td}><StatusBadge status={o.status} /></td>
                      <td className={`${td} whitespace-nowrap text-muted`}>{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="p-8 text-center text-sm text-muted">No orders yet.</p>}
        </div>
        <div className="card p-5">
          <h2 className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 text-amber-500" /> Low stock</h2>
          {s.lowStock.length ? (
            <ul className="mt-4 space-y-3">
              {s.lowStock.map((p) => (
                <li key={p._id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{p.name}</span>
                  <span className={`badge ${p.stock === 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{p.stock} left</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm text-muted">All products are well stocked.</p>}
          <Link to="/products" className="btn-outline btn-sm mt-5 w-full">Manage products</Link>
        </div>
      </div>
    </>
  );
}
