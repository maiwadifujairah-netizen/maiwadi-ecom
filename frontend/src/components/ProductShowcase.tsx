import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShoppingCart } from 'lucide-react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useSite } from '../context/SiteContext';
import { useUI } from '../context/UIContext';
import { canBuy } from './ProductCard';
import QuantitySelector from './QuantitySelector';
import StockBadge from './StockBadge';
import { WhatsAppIcon } from './icons';
import { Img } from './States';
import { HIGHLIGHTS } from '../utils/brand';
import { waHref } from '../utils/format';

const GALLERY = [
  { src: '/images/facility.webp', title: 'Advanced purification', text: 'Processed with state-of-the-art purification technology in Fujairah.' },
  { src: '/images/delivery.webp', title: 'Prompt delivery', text: 'Reliable delivery schedules for homes and offices.' },
  { src: '/images/cans-duo.webp', title: 'Reusable bottles', text: 'Returnable 5-gallon bottles help reduce single-use plastic.' },
];

/** Premium single-product presentation. `withGallery` adds supporting brand imagery below it. */
export default function ProductShowcase({ product, withGallery = false }: { product: Product; withGallery?: boolean }) {
  const { money, settings } = useSite();
  const { add } = useCart();
  const { toast } = useUI();
  const [qty, setQty] = useState(1);
  const buyable = canBuy(product);

  return (
    <div>
      <div className="grid overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-ocean/5 lg:grid-cols-[1.05fr_1fr]">
        <Link to={`/products/${product.slug}`} className="relative flex items-center justify-center bg-gradient-to-br from-mist via-white to-mist px-6 py-10 sm:px-12 sm:py-14" aria-label={`View ${product.name}`}>
          <div className="pointer-events-none absolute inset-0 m-auto size-72 rounded-full bg-aqua/20 blur-3xl sm:size-96" />
          <Img src={product.images[0]} alt={product.name} className="relative max-h-[300px] w-auto object-contain drop-shadow-2xl sm:max-h-[440px]" />
        </Link>

        <div className="flex flex-col justify-center gap-5 p-6 sm:p-10 lg:p-12">
          <div className="flex flex-wrap items-center gap-2">
            {product.category && <span className="text-xs font-bold tracking-wider text-ocean uppercase">{product.category.name}</span>}
            <StockBadge stock={product.stock} price={product.price} />
          </div>
          <h3 className="text-3xl leading-tight font-bold sm:text-4xl">{product.name}</h3>
          {product.shortDescription && <p className="text-base leading-relaxed text-muted sm:text-lg">{product.shortDescription}</p>}

          <ul className="grid gap-2.5 sm:grid-cols-2">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm font-medium text-ink/80"><CheckCircle2 className="size-4 shrink-0 text-aqua" /> {h}</li>
            ))}
          </ul>

          <div className="border-t border-slate-100 pt-5">
            <p className="font-display text-4xl font-bold text-deep">{product.price > 0 ? money(product.price) : 'Contact us for pricing'}</p>
            {product.price > 0 && settings.deliveryFee === 0 && <p className="mt-1 text-sm text-muted">Delivered to your door</p>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {buyable && <QuantitySelector value={qty} max={product.stock} onChange={setQty} />}
            {buyable ? (
              <button className="btn-primary flex-1 py-3.5 sm:flex-none sm:px-8" onClick={() => { add(product, qty); toast(`${qty} × ${product.name} added to cart`); }}>
                <ShoppingCart className="size-4" /> Add to cart
              </button>
            ) : settings.whatsapp ? (
              <a href={waHref(settings.whatsapp, `Hello MAI WADI, I would like to order: ${product.name}`)} target="_blank" rel="noopener" className="btn-primary">
                <WhatsAppIcon className="size-4" /> Order via WhatsApp
              </a>
            ) : null}
            <Link to={`/products/${product.slug}`} className="btn-outline">View details</Link>
          </div>
        </div>
      </div>

      {withGallery && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {GALLERY.map((g) => (
            <figure key={g.src} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
              <img src={g.src} alt={g.title} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
              <figcaption className="p-5">
                <p className="font-semibold">{g.title}</p>
                <p className="mt-1 text-sm text-muted">{g.text}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
