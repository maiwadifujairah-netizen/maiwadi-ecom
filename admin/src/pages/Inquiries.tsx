import { useState } from 'react';
import { Mail, Phone, Trash2 } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useUI } from '../context/UIContext';
import { api, errorMessage } from '../services/api';
import { AdminHeader } from '../components/AdminUI';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { WhatsAppIcon } from '../components/icons';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { formatDate, telHref, waHref } from '../utils/format';
import type { Inquiry, Paged } from '../types';

export default function AdminInquiries() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch<Paged<Inquiry>>(`/contact?page=${page}&status=${status}`);
  const { toast, confirm } = useUI();

  async function setInquiryStatus(i: Inquiry, s: Inquiry['status']) {
    try {
      await api.patch(`/contact/${i._id}`, { status: s });
      reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  }

  async function remove(i: Inquiry) {
    if (!(await confirm({ title: 'Delete this inquiry?', confirmText: 'Delete', danger: true }))) return;
    try {
      await api.delete(`/contact/${i._id}`);
      toast('Inquiry deleted');
      reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  }

  return (
    <>
      <AdminHeader title="Contact inquiries" text="Messages submitted through the Contact page." />
      <div className="mb-4 flex flex-wrap gap-2">
        {['', 'new', 'read', 'resolved'].map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize ${status === s ? 'bg-ocean text-white' : 'bg-white text-ink/70 ring-1 ring-slate-200 hover:ring-ocean'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>
      {loading && !data ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} />
        : !data?.items.length ? <div className="card"><EmptyState title="No inquiries" /></div>
        : (
          <ul className="space-y-4">
            {data.items.map((i) => (
              <li key={i._id} className={`card p-5 ${i.status === 'new' ? 'border-l-4 border-l-ocean' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2"><p className="font-semibold">{i.name}</p><StatusBadge status={i.status} /></div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <a href={`mailto:${i.email}`} className="inline-flex items-center gap-1.5 text-deep hover:text-ocean"><Mail className="size-3.5" /> {i.email}</a>
                      {i.phone && <a href={telHref(i.phone)} className="inline-flex items-center gap-1.5 text-deep hover:text-ocean"><Phone className="size-3.5" /> {i.phone}</a>}
                      {i.phone && <a href={waHref(i.phone, `Hello ${i.name}, thank you for contacting MAI WADI.`)} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-deep hover:text-ocean"><WhatsAppIcon className="size-3.5" /> WhatsApp</a>}
                    </div>
                  </div>
                  <p className="text-xs text-muted">{formatDate(i.createdAt, true)}</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink/80">{i.message}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {i.status !== 'read' && <button className="btn-outline btn-sm" onClick={() => setInquiryStatus(i, 'read')}>Mark as read</button>}
                  {i.status !== 'resolved' && <button className="btn-primary btn-sm" onClick={() => setInquiryStatus(i, 'resolved')}>Mark resolved</button>}
                  <button className="ml-auto rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => remove(i)} aria-label="Delete inquiry"><Trash2 className="size-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </>
  );
}
