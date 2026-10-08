import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useMeta } from '../hooks/useMeta';
import PageHeader from '../components/PageHeader';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import { ImageFeatures, WaterWave } from '../components/BrandSections';
import { SUPPLY_IMAGE, WATER_HERO } from '../utils/brand';
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
  const filtered = Boolean(params.get('search')) || Boolean(category);
  const { data, loading, error, reload } = useFetch<Paged<Product>>(`/products?${q}`, !filtered && page === 1);
  const { data: categories } = useFetch<Category[]>('/categories', true);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next);
  };

  return (
    <>
      <PageHeader crumb="Products" title="Our products" text="Purified drinking water, ready for delivery to your home or office." image={WATER_HERO} />

      <section className="container-x pt-8 pb-16 sm:pb-20">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 md:pb-0">
            {[{ _id: '', name: 'All Products' }, ...(categories ?? [])].map((c) => (
              <button key={c._id} onClick={() => setParam('category', c._id)} aria-pressed={category === c._id}
                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${category === c._id ? 'bg-ocean text-white shadow-md shadow-ocean/25' : 'bg-white text-ink ring-1 ring-slate-200 hover:text-ocean hover:ring-ocean/30'}`}>
                {c.name}
              </button>
            ))}
          </div>
          <label className="relative md:w-72">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
            <input type="search" className="input rounded-full pl-10" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
        </div>

        {loading && !data ? <Loading label="Loading products…" />
          : error ? <ErrorState message={error} onRetry={reload} />
          : !data?.items.length ? <EmptyState title="No products found" text={filtered ? 'Try a different search or category.' : 'Products will appear here soon.'} />
          : (
            <>
              <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${loading ? 'opacity-60' : ''}`}>
                {data.items.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
              <Pagination page={data.page} pages={data.pages} onChange={(p) => setParam('page', String(p))} />
            </>
          )}

        <div className="mt-16">
          <ImageFeatures />
        </div>

        {/* Same light-banner treatment as the delivery section: copy left over the wave, filling-line photo right. */}
        <div className="relative isolate mt-16 overflow-hidden rounded-3xl bg-[linear-gradient(115deg,#ffffff_0%,#f3f9fe_35%,#e3f1fc_100%)] shadow-[0_18px_48px_-28px_rgb(11_30_71/0.35)] ring-1 ring-ocean/10">
          <div className="relative aspect-[3/2] sm:aspect-[16/9] xl:absolute xl:inset-y-0 xl:right-0 xl:aspect-auto xl:w-[64%]">
            <img src={SUPPLY_IMAGE} alt="MAI WADI cans with the Dial Us On label on the filling line" width={1536} height={1024} loading="lazy" decoding="async"
              className="size-full object-cover object-[40%_60%] [mask-image:linear-gradient(90deg,transparent,#000_8%),linear-gradient(180deg,#000_95%,transparent)] [mask-composite:intersect] xl:[mask-image:linear-gradient(90deg,transparent,rgb(0_0_0/0.6)_2%,#000_4%)]" />
          </div>
          <WaterWave className="h-36 w-[70%] xl:h-44 xl:w-[36%]" />
          {/* Faint drop outline where the copy meets the photo (decorative, desktop only). */}
          <svg aria-hidden="true" viewBox="0 0 64 88" className="pointer-events-none absolute bottom-[14%] left-[31%] -z-10 hidden h-36 w-auto text-ocean/20 xl:block">
            <path fill="none" stroke="currentColor" strokeWidth="2" d="M32 3C20 22 6 40 6 57a26 26 0 0 0 52 0C58 40 44 22 32 3z" />
            <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M32 18C24 32 15 45 15 57a17 17 0 0 0 34 0c0-12-9-25-17-39z" />
          </svg>
          <div className="relative px-6 pt-2 pb-10 sm:px-10 sm:pb-12 lg:max-w-3xl xl:w-[37%] xl:max-w-none xl:px-12 xl:py-9">
            <span className="eyebrow">Business supply</span>
            <h2 className="section-title mt-3">Need regular supply for your business?</h2>
            <p className="mt-4 leading-relaxed text-muted">We provide customised delivery plans for offices, restaurants and businesses across Fujairah.</p>
            <Link to="/contact" className="btn-primary mt-8 px-7">Contact us <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
