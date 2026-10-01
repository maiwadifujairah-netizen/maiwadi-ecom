const COLORS: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700', Confirmed: 'bg-sky-50 text-sky-700', Processing: 'bg-indigo-50 text-indigo-700',
  Shipped: 'bg-cyan-50 text-cyan-700', Delivered: 'bg-emerald-50 text-emerald-700', Cancelled: 'bg-red-50 text-red-600',
  pending: 'bg-amber-50 text-amber-700', paid: 'bg-emerald-50 text-emerald-700', failed: 'bg-red-50 text-red-600', refunded: 'bg-slate-100 text-slate-600',
  new: 'bg-sky-50 text-sky-700', read: 'bg-slate-100 text-slate-600', resolved: 'bg-emerald-50 text-emerald-700',
  active: 'bg-emerald-50 text-emerald-700', blocked: 'bg-red-50 text-red-600',
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge capitalize ${COLORS[status] ?? 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}
