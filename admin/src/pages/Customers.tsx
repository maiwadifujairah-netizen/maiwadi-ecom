import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useDebounced } from '../hooks/useDebounced';
import { useSite } from '../context/SiteContext';
import { AdminHeader, td, th } from '../components/AdminUI';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { formatDate } from '../utils/format';
import type { Customer, Paged } from '../types';

export default function AdminCustomers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const { data, loading, error, reload } = useFetch<Paged<Customer>>(`/customers?page=${page}&search=${encodeURIComponent(q)}`);
  const { money } = useSite();

  return (
    <>
      <AdminHeader title="Customers" text="Registered customer accounts. Guest orders appear under Orders." />
      <label className="relative mb-4 block max-w-sm">
        <span className="sr-only">Search customers</span>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Name, email or phone…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </label>
      <div className="card overflow-hidden">
        {loading && !data ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} />
          : !data?.items.length ? <EmptyState title="No customers yet" />
          : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50"><tr><th className={th}>Name</th><th className={th}>Contact</th><th className={th}>Orders</th><th className={th}>Spent</th><th className={th}>Status</th><th className={th}>Joined</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50">
                      <td className={td}><Link to={`/customers/${c._id}`} className="font-semibold text-ocean">{c.name}</Link></td>
                      <td className={td}><p>{c.email}</p><p className="text-xs text-muted">{c.phone || '—'}</p></td>
                      <td className={td}>{c.orders}</td>
                      <td className={`${td} whitespace-nowrap`}>{money(c.spent ?? 0)}</td>
                      <td className={td}><StatusBadge status={c.status} /></td>
                      <td className={`${td} whitespace-nowrap text-muted`}>{formatDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </>
  );
}
