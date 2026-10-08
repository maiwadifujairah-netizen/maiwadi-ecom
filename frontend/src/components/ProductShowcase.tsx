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
import ZoomableImage from './ZoomableImage';
import { HIGHLIGHTS } from '../utils/brand';
import { waHref } from '../utils/format';

/** Premium single-product presentation, used when the catalogue has one product. */
export default function ProductShowcase({ product }: { product: Product }) {
  const { money, settings } = useSite();
  const { add } = useCart();
  const { toast } = useUI();
  const [qty, setQty] = useState(1);
  const buyable = canBuy(product);

  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <ZoomableImage src={product.images[0]} alt={product.name} className="mx-auto sm:max-w-md lg:max-w-[30rem]">
        <span className="absolute top-5 right-5"><StockBadge stock={product.stock} price={product.price} /></span>
      </ZoomableImage>

      <div className="flex flex-col gap-5">
        {product.category && <span className="eyebrow self-start">{product.category.name}</span>}
        <h3 className="text-3xl leading-tight font-bold sm:text-4xl">{product.name}</h3>
        {product.shortDescription && <p className="text-base leading-relaxed text-muted sm:text-lg">{product.shortDescription}</p>}

        <ul className="grid gap-3 sm:grid-cols-2">
          {HIGHLIGHTS.map((h) => (
            <li key={h} className="flex items-center gap-2.5 text-[15px] font-medium text-ink/80"><CheckCircle2 className="size-5 shrink-0 fill-ocean/15 text-ocean" /> {h}</li>
          ))}
        </ul>

        <div>
          <p className="font-display text-4xl font-bold text-ocean">{product.price > 0 ? money(product.price) : 'Contact us for pricing'}</p>
          {product.price > 0 && settings.deliveryFee === 0 && <p className="mt-1 text-sm text-muted">Delivered to your door</p>}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {buyable && <QuantitySelector value={qty} max={product.stock} onChange={setQty} />}
          {buyable ? (
            <button className="btn-primary px-8" onClick={() => { add(product, qty); toast(`${qty} × ${product.name} added to cart`); }}>
              <ShoppingCart className="size-5" /> Add to cart
            </button>
          ) : settings.whatsapp ? (
            <a href={waHref(settings.whatsapp, `Hello MAI WADI, I would like to order: ${product.name}`)} target="_blank" rel="noopener noreferrer" className="btn-primary px-8">
              <WhatsAppIcon className="size-4" /> Order via WhatsApp
            </a>
          ) : null}
          <Link to={`/products/${product.slug}`} className="btn-outline px-8">View details</Link>
        </div>
      </div>
    </div>
  );
}
