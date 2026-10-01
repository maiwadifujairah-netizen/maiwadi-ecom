import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useUI } from '../context/UIContext';
import { api, errorMessage } from '../services/api';
import { AdminHeader, td, th } from '../components/AdminUI';
import Modal from '../components/Modal';
import { EmptyState, ErrorState, Loading, Spinner } from '../components/States';
import type { Category } from '../types';

export default function AdminCategories() {
  const { data, loading, error, reload } = useFetch<Category[]>('/categories');
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [busy, setBusy] = useState(false);
  const { toast, confirm } = useUI();

  const open = (c: Category | 'new') => {
    setForm(c === 'new' ? { name: '', description: '' } : { name: c.name, description: c.description ?? '' });
    setEditing(c);
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast('Category name must be at least 2 characters', 'error');
    setBusy(true);
    try {
      if (editing === 'new') await api.post('/categories', form);
      else if (editing) await api.put(`/categories/${editing._id}`, form);
      toast('Category saved');
      setEditing(null);
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: Category) {
    if (!(await confirm({ title: `Delete "${c.name}"?`, confirmText: 'Delete', danger: true }))) return;
    try {
      await api.delete(`/categories/${c._id}`);
      toast('Category deleted');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <>
      <AdminHeader title="Categories" text="Group products so customers can filter the catalogue." action={<button className="btn-primary" onClick={() => open('new')}><Plus className="size-4" /> Add category</button>} />
      <div className="card overflow-hidden">
        {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.length ? <EmptyState title="No categories yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50"><tr><th className={th}>Name</th><th className={th}>Description</th><th className={th}>Products</th><th className={th}><span className="sr-only">Actions</span></th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className={`${td} font-semibold`}>{c.name}</td>
                    <td className={`${td} text-muted`}>{c.description || '—'}</td>
                    <td className={td}>{c.productCount}</td>
                    <td className={`${td} text-right whitespace-nowrap`}>
                      <button className="rounded-lg p-2 text-deep hover:bg-mist" onClick={() => open(c)} aria-label={`Edit ${c.name}`}><Pencil className="size-4" /></button>
                      <button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => remove(c)} aria-label={`Delete ${c.name}`}><Trash2 className="size-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editing && (
        <Modal title={editing === 'new' ? 'Add category' : 'Edit category'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <div><label className="label" htmlFor="c-name">Name</label><input id="c-name" className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label" htmlFor="c-desc">Description</label><textarea id="c-desc" rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex justify-end gap-3"><button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn-primary" disabled={busy}>{busy && <Spinner className="size-4" />} Save</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
