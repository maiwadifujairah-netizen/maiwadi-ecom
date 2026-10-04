import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useMeta } from '../hooks/useMeta';
import PageHeader from '../components/PageHeader';
import ProductCard from '../components/ProductCard';
import ProductShowcase from '../components/ProductShowcase';
import Pagination from '../components/Pagination';
import { FeatureCards } from '../components/BrandSections';
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

  const filtered = Boolean(params.get('search')) || Boolean(category);

  return (
    <>
      <PageHeader crumb="Products" title={data?.total === 1 && !filtered ? 'Our product' : 'Our products'} text="Purified drinking water, ready for delivery to your home or office." />

      <section className="container-x pt-8 pb-16 sm:pb-20">
        <div className="card mb-8 flex flex-col gap-4 p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {[{ _id: '', name: 'All products' }, ...(categories ?? [])].map((c) => (
              <button key={c._id} onClick={() => setParam('category', c._id)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${category === c._id ? 'bg-ocean text-white shadow-md shadow-ocean/25' : 'text-deep hover:bg-mist'}`}>
                {c.name}
              </button>
            ))}
          </div>
          <label className="relative md:w-72">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
            <input type="search" className="input rounded-full bg-mist/60 pl-10" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
        </div>

        {loading && !data ? <Loading label="Loading products…" />
          : error ? <ErrorState message={error} onRetry={reload} />
          : !data?.items.length ? <EmptyState title="No products found" text={filtered ? 'Try a different search or category.' : 'Products will appear here soon.'} />
          : data.items.length === 1 && !filtered && data.total === 1 ? <ProductShowcase product={data.items[0]} />
          : (
            <>
              <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
                {data.items.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
              <Pagination page={data.page} pages={data.pages} onChange={(p) => setParam('page', String(p))} />
            </>
          )}

        <div className="relative isolate mt-16 overflow-hidden rounded-2xl bg-mist p-8 ring-1 ring-ocean/10 sm:p-12">
          <img src="/images/truck.jpg" alt="" aria-hidden="true" loading="lazy" className="absolute inset-y-0 right-0 -z-10 hidden h-full w-1/2 object-cover object-[75%_60%] [mask-image:linear-gradient(90deg,transparent,black_45%)] md:block" />
          <div className="max-w-lg">
            <h2 className="text-2xl font-bold sm:text-3xl">Need regular supply for your business?</h2>
            <p className="mt-3 text-muted">We provide customised delivery plans for offices, restaurants and businesses across Fujairah.</p>
            <Link to="/contact" className="btn-primary mt-6">Contact us <ArrowRight className="size-4" /></Link>
          </div>
        </div>

        <div className="mt-16">
          <FeatureCards />
        </div>
      </section>
    </>
  );
}
