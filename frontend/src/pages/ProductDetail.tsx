import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ShoppingCart, Truck } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useMeta } from '../hooks/useMeta';
import { useCart } from '../context/CartContext';
import { useSite } from '../context/SiteContext';
import { useUI } from '../context/UIContext';
import ProductCard, { canBuy } from '../components/ProductCard';
import QuantitySelector from '../components/QuantitySelector';
import StockBadge from '../components/StockBadge';
import { WhatsAppIcon } from '../components/icons';
import { ErrorState, Img, Loading } from '../components/States';
import { waHref } from '../utils/format';
import type { Product } from '../types';

export default function ProductDetail() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useFetch<{ product: Product; related: Product[] }>(`/products/${slug}`, true);
  const { add } = useCart();
  const { money, settings } = useSite();
  const { toast } = useUI();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const p = data?.product;
  useMeta(p?.name ?? 'Product', p?.shortDescription);
  useEffect(() => { setQty(1); setActive(0); }, [slug]);

  if (loading) return <Loading label="Loading product…" />;
  if (error || !p) return <div className="container-x"><ErrorState message={error ?? 'Product not found'} onRetry={reload} /><div className="text-center"><Link to="/products" className="btn-outline">Back to products</Link></div></div>;

  const buyable = canBuy(p);
  const images = p.images.length ? p.images : [''];

  return (
    <div className="container-x py-8 sm:py-12">
      <nav className="mb-8 flex items-center gap-1 text-sm text-muted" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-ocean">Home</Link><ChevronRight className="size-4" />
        <Link to="/products" className="hover:text-ocean">Products</Link><ChevronRight className="size-4" />
        <span className="truncate text-ink">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="media-panel aspect-square">
            <Img src={images[active]} alt={p.name} eager product className="product-img p-10 sm:p-14" />
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button key={src} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`}
                  className={`size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-mist ${i === active ? 'border-ocean' : 'border-transparent'}`}>
                  <Img src={src} alt="" product width={200} className="size-full object-contain p-2 mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            {p.category && <Link to={`/products?category=${p.category._id}`} className="text-xs font-bold tracking-wider text-ocean uppercase">{p.category.name}</Link>}
            <StockBadge stock={p.stock} price={p.price} />
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">{p.name}</h1>
          {p.shortDescription && <p className="text-lg text-muted">{p.shortDescription}</p>}
          <p className="font-display text-4xl font-bold text-deep">{p.price > 0 ? money(p.price) : 'Contact us for pricing'}</p>
          {p.price > 0 && <p className="text-sm text-muted">{p.stock > 0 ? `${p.stock} available` : 'Currently out of stock'}</p>}

          {buyable && (
            <div className="flex flex-wrap items-center gap-3">
              <QuantitySelector value={qty} max={p.stock} onChange={setQty} />
              <button className="btn-primary flex-1 py-3.5 sm:flex-none sm:px-10" onClick={() => { add(p, qty); toast(`${qty} × ${p.name} added to cart`); }}>
                <ShoppingCart className="size-4" /> Add to cart
              </button>
            </div>
          )}
          {settings.whatsapp && (
            <a href={waHref(settings.whatsapp, `Hello MAI WADI, I would like to order: ${p.name}`)} target="_blank" rel="noopener" className="btn-outline self-start">
              <WhatsAppIcon className="size-4 text-[#25D366]" /> Order via WhatsApp
            </a>
          )}
          <div className="flex items-center gap-3 rounded-2xl bg-mist p-4 text-sm text-deep">
            <Truck className="size-5 shrink-0 text-ocean" />
            {settings.deliveryFee > 0 ? `Delivery fee: ${money(settings.deliveryFee)}` : 'Delivered to your door by our own team'}
          </div>
          {p.description && (
            <div className="border-t border-slate-100 pt-6">
              <h2 className="text-lg font-semibold">Product details</h2>
              <p className="mt-3 leading-relaxed whitespace-pre-line text-muted">{p.description}</p>
            </div>
          )}
        </div>
      </div>

      {data.related.length > 0 && (
        <section className="mt-20">
          <h2 className="section-title mb-8 text-2xl sm:text-3xl">You may also like</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{data.related.map((r) => <ProductCard key={r._id} product={r} />)}</div>
        </section>
      )}
    </div>
  );
}
