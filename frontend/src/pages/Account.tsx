import { Link, Navigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { useSite } from '../context/SiteContext';
import { EmptyState, ErrorState, Loading } from '../components/States';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/format';
import type { Order } from '../types';

export default function Account() {
  useMeta('My account');
  const { user, loading: authLoading, logout } = useAuth();
  const { money } = useSite();
  const { data, loading, error, reload } = useFetch<Order[]>(user ? '/orders/mine' : null);

  if (authLoading) return <Loading />;
  if (!user) return <Navigate to="/login?next=/account" replace />;

  return (
    <div className="container-x py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Hello, {user.name.split(' ')[0]}</h1>
          <p className="mt-1 text-muted">{user.email}</p>
        </div>
        <button className="btn-outline btn-sm" onClick={logout}><LogOut className="size-4" /> Sign out</button>
      </div>
      <h2 className="mt-10 text-xl font-semibold">Order history</h2>
      <div className="mt-4">
        {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} />
          : !data?.length ? <EmptyState title="No orders yet" action={<Link to="/products" className="btn-primary mt-2">Start shopping</Link>} />
          : (
            <ul className="space-y-4">
              {data.map((o) => (
                <li key={o._id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{o.orderNumber}</p>
                      <p className="text-xs text-muted">{formatDate(o.createdAt, true)}</p>
                    </div>
                    <StatusBadge status={o.status} />
                    <p className="font-display text-lg font-bold text-deep">{money(o.total)}</p>
                  </div>
                  <p className="mt-3 text-sm text-muted">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</p>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}
