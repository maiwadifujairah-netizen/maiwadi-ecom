import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useMeta } from '../hooks/useMeta';
import PageHeader from '../components/PageHeader';
import ProductCard from '../components/ProductCard';
import ProductShowcase from '../components/ProductShowcase';
import Pagination from '../components/Pagination';
import { EmptyState, ErrorState, Loading } from '../components/States';
import type { Category, Paged, Product } from '../types';

export default function Products() {
  useMeta('Products', 'Browse MAI WADI drinking water products and order online for delivery.');
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? '';
  const page = Number(params.get('page')) || 1;
  const [search, setSearch] = useState(params.get('search') ?? '');

  // debounce search into the URL
  useEffect(() => {
    const t = setTimeout(() => {
      if (search === (params.get('search') ?? '')) return;
      const next = new URLSearchParams(params);
      search ? next.set('search', search) : next.delete('search');
      next.delete('page');
      setParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [search, params, setParams]);

  const q = new URLSearchParams({ page: String(page), limit: '12' });
  if (params.get('search')) q.set('search', params.get('search')!);
  if (category) q.set('category', category);
  const { data, loading, error, reload } = useFetch<Paged<Product>>(`/products?${q}`);
  const { data: categories } = useFetch<Category[]>('/categories');

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next);
  };

  // Filters only earn their space once the catalogue grows.
  const showFilters = (categories?.length ?? 0) > 1 || (data?.total ?? 0) > 3 || Boolean(params.get('search')) || Boolean(category);

  return (
    <>
      <PageHeader eyebrow="Shop" title={data?.total === 1 ? 'Our product' : 'Our products'} text="Purified drinking water, ready for delivery to your home or office." />
      <section className="container-x pb-20">
        {showFilters && (
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {[{ _id: '', name: 'All' }, ...(categories ?? [])].map((c) => (
                <button key={c._id} onClick={() => setParam('category', c._id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${category === c._id ? 'bg-ocean text-white' : 'bg-mist text-deep hover:bg-ocean/10'}`}>
                  {c.name}
                </button>
              ))}
            </div>
            <label className="relative md:w-72">
              <span className="sr-only">Search products</span>
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
              <input className="input rounded-full pl-10" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
          </div>
        )}
        {loading && !data ? <Loading label="Loading products…" />
          : error ? <ErrorState message={error} onRetry={reload} />
          : !data?.items.length ? <EmptyState title="No products found" text={params.get('search') || category ? 'Try a different search or category.' : 'Products will appear here soon.'} />
          : data.items.length === 1 && !showFilters ? <ProductShowcase product={data.items[0]} withGallery />
          : (
            <>
              <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
                {data.items.map((p) => <ProductCard key={p._id} product={p} withQuantity />)}
              </div>
              <Pagination page={data.page} pages={data.pages} onChange={(p) => setParam('page', String(p))} />
            </>
          )}
      </section>
    </>
  );
}
