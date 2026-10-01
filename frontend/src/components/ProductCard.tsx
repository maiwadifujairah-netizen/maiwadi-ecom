import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useSite } from '../context/SiteContext';
import { useUI } from '../context/UIContext';
import { Img } from './States';
import QuantitySelector from './QuantitySelector';
import StockBadge from './StockBadge';

export const canBuy = (p: Product) => p.price > 0 && p.stock > 0;

export default function ProductCard({ product, withQuantity = false }: { product: Product; withQuantity?: boolean }) {
  const { add } = useCart();
  const { money } = useSite();
  const { toast } = useUI();
  const [qty, setQty] = useState(1);
  const buyable = canBuy(product);

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-ocean/10">
      <Link to={`/products/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-gradient-to-b from-mist to-white">
        <Img src={product.images[0]} alt={product.name} className="size-full object-contain p-6 mix-blend-multiply transition duration-500 group-hover:scale-105" />
        <div className="absolute top-4 left-4"><StockBadge stock={product.stock} price={product.price} /></div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-6">
        {product.category && <p className="text-xs font-semibold tracking-wider text-ocean uppercase">{product.category.name}</p>}
        <h3 className="text-xl font-semibold"><Link to={`/products/${product.slug}`} className="hover:text-ocean">{product.name}</Link></h3>
        {product.shortDescription && <p className="line-clamp-2 text-sm text-muted">{product.shortDescription}</p>}
        <p className="mt-auto pt-2 font-display text-2xl font-bold text-deep">{product.price > 0 ? money(product.price) : 'Contact us'}</p>
        {withQuantity && buyable && <QuantitySelector size="sm" value={qty} max={product.stock} onChange={setQty} />}
        <div className="flex gap-2">
          <Link to={`/products/${product.slug}`} className="btn-outline btn-sm flex-1">View details</Link>
          <button
            className="btn-primary btn-sm flex-1"
            disabled={!buyable}
            onClick={() => { add(product, qty); toast(`${product.name} added to cart`); }}
          >
            <ShoppingCart className="size-4" /> Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
