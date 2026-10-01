import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useDebounced } from '../hooks/useDebounced';
import { useSite } from '../context/SiteContext';
import { useUI } from '../context/UIContext';
import { api, errorMessage } from '../services/api';
import { AdminHeader, Toggle, td, th } from '../components/AdminUI';
import ImageUploader from '../components/ImageUploader';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import StockBadge from '../components/StockBadge';
import { EmptyState, ErrorState, Img, Loading, Spinner } from '../components/States';
import type { Category, Paged, Product } from '../types';

type Form = { name: string; shortDescription: string; description: string; images: string[]; price: string; stock: string; category: string; isActive: boolean; featured: boolean };
const EMPTY: Form = { name: '', shortDescription: '', description: '', images: [], price: '', stock: '', category: '', isActive: true, featured: true };

function ProductForm({ product, categories, onSaved, onClose }: { product: Product | null; categories: Category[]; onSaved: () => void; onClose: () => void }) {
  const { toast } = useUI();
  const [f, setF] = useState<Form>(
    product
      ? { name: product.name, shortDescription: product.shortDescription, description: product.description, images: product.images, price: String(product.price), stock: String(product.stock), category: product.category?._id ?? '', isActive: product.isActive, featured: product.featured }
      : { ...EMPTY, category: categories[0]?._id ?? '' },
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err: typeof errors = {};
    if (f.name.trim().length < 2) err.name = 'Name is required';
    if (f.price === '' || Number(f.price) < 0 || Number.isNaN(Number(f.price))) err.price = 'Enter a valid price (0 = price on request)';
    if (f.stock === '' || !Number.isInteger(Number(f.stock)) || Number(f.stock) < 0) err.stock = 'Enter a whole number';
    setErrors(err);
    if (Object.keys(err).length) return;

    setBusy(true);
    try {
      const body = { ...f, price: Number(f.price), stock: Number(f.stock), category: f.category || null };
      if (product) await api.put(`/products/${product._id}`, body);
      else await api.post('/products', body);
      toast(product ? 'Product updated' : 'Product created');
      onSaved();
    } catch (e) {
      toast(errorMessage(e), 'error');
      setBusy(false);
    }
  }

  return (
    <Modal title={product ? 'Edit product' : 'Add product'} onClose={onClose} wide>
      <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="p-name">Product name</label>
          <input id="p-name" className="input" value={f.name} onChange={(e) => set('name', e.target.value)} aria-invalid={Boolean(errors.name)} />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div>
          <label className="label" htmlFor="p-price">Price</label>
          <input id="p-price" type="number" min={0} step="0.01" className="input" value={f.price} onChange={(e) => set('price', e.target.value)} aria-invalid={Boolean(errors.price)} />
          {errors.price ? <p className="field-error">{errors.price}</p> : <p className="mt-1 text-xs text-muted">Set 0 to show "Contact us" and disable online ordering.</p>}
        </div>
        <div>
          <label className="label" htmlFor="p-stock">Stock quantity</label>
          <input id="p-stock" type="number" min={0} step={1} className="input" value={f.stock} onChange={(e) => set('stock', e.target.value)} aria-invalid={Boolean(errors.stock)} />
          {errors.stock && <p className="field-error">{errors.stock}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="p-cat">Category</label>
          <select id="p-cat" className="input" value={f.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">— No category —</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="p-short">Short description</label>
          <input id="p-short" maxLength={240} className="input" value={f.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="p-desc">Full description</label>
          <textarea id="p-desc" rows={5} className="input" value={f.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <span className="label">Images</span>
          <ImageUploader value={f.images} onChange={(v) => set('images', v)} folder="products" />
        </div>
        <div className="flex flex-wrap gap-6 sm:col-span-2">
          <Toggle checked={f.isActive} onChange={(v) => set('isActive', v)} label="Available on website" />
          <Toggle checked={f.featured} onChange={(v) => set('featured', v)} label="Featured on homepage" />
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2">
          <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy && <Spinner className="size-4" />} Save product</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const { data, loading, error, reload } = useFetch<Paged<Product>>(`/products/admin?page=${page}&limit=20&search=${encodeURIComponent(q)}`);
  const { data: categories } = useFetch<Category[]>('/categories');
  const [editing, setEditing] = useState<Product | null | 'new'>(null);
  const { money } = useSite();
  const { toast, confirm } = useUI();

  async function remove(p: Product) {
    if (!(await confirm({ title: `Delete "${p.name}"?`, message: 'This removes the product from your store. Past orders keep their details.', confirmText: 'Delete', danger: true }))) return;
    try {
      await api.delete(`/products/${p._id}`);
      toast('Product deleted');
      reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  }

  return (
    <>
      <AdminHeader title="Products" text="Add, edit and manage everything in your catalogue." action={<button className="btn-primary" onClick={() => setEditing('new')}><Plus className="size-4" /> Add product</button>} />
      <label className="relative mb-4 block max-w-sm">
        <span className="sr-only">Search products</span>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Search products…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </label>
      <div className="card overflow-hidden">
        {loading && !data ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} />
          : !data?.items.length ? <EmptyState title="No products" text="Add your first product to start selling." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50"><tr><th className={th}>Product</th><th className={th}>Category</th><th className={th}>Price</th><th className={th}>Stock</th><th className={th}>Status</th><th className={th}><span className="sr-only">Actions</span></th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50">
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-mist"><Img src={p.images[0]} alt="" className="size-full object-contain mix-blend-multiply" /></div>
                          <div className="min-w-0"><p className="truncate font-semibold">{p.name}</p><p className="truncate text-xs text-muted">/{p.slug}</p></div>
                        </div>
                      </td>
                      <td className={`${td} text-muted`}>{p.category?.name ?? '—'}</td>
                      <td className={`${td} font-semibold whitespace-nowrap`}>{p.price > 0 ? money(p.price) : 'On request'}</td>
                      <td className={td}><StockBadge stock={p.stock} price={1} /> <span className="ml-1 text-muted">{p.stock}</span></td>
                      <td className={td}>{p.isActive ? <span className="badge bg-emerald-50 text-emerald-700">Visible</span> : <span className="badge bg-slate-100 text-slate-600">Hidden</span>}</td>
                      <td className={`${td} text-right whitespace-nowrap`}>
                        <button className="rounded-lg p-2 text-deep hover:bg-mist" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}><Pencil className="size-4" /></button>
                        <button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => remove(p)} aria-label={`Delete ${p.name}`}><Trash2 className="size-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
      {editing && (
        <ProductForm product={editing === 'new' ? null : editing} categories={categories ?? []} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
      )}
    </>
  );
}
