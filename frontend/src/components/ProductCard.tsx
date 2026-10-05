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

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const { money } = useSite();
  const { toast } = useUI();
  const [qty, setQty] = useState(1);
  const buyable = canBuy(product);
  const url = `/products/${product.slug}`;

  return (
    <article className="card group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ocean/10">
      <Link to={url} className="relative block aspect-square overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#ffffff_0%,#eaf4fc_70%,#dceefb_100%)]">
        <Img src={product.images[0]} alt={product.name} product width={800}
          className="product-img p-8 transition duration-500 group-hover:scale-[1.04] sm:p-10" />
        <div className="absolute top-4 right-4"><StockBadge stock={product.stock} price={product.price} /></div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg leading-snug font-bold"><Link to={url} className="hover:text-ocean">{product.name}</Link></h3>
        {product.category && <p className="mt-0.5 text-sm text-muted">{product.category.name}</p>}
        {product.shortDescription && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{product.shortDescription}</p>}
        <p className="mt-auto pt-4 font-display text-2xl font-bold text-ocean">{product.price > 0 ? money(product.price) : 'Contact us'}</p>
        <div className="mt-4 flex items-center gap-2">
          {buyable && <QuantitySelector size="sm" value={qty} max={product.stock} onChange={setQty} />}
          <button className="btn-primary btn-sm min-h-10 flex-1 rounded-xl" disabled={!buyable}
            onClick={() => { add(product, qty); toast(`${qty} × ${product.name} added to cart`); }}>
            <ShoppingCart className="size-4" /> Add to cart
          </button>
        </div>
        <Link to={url} className="mt-3 text-center text-sm font-semibold text-deep hover:text-ocean">View details</Link>
      </div>
    </article>
  );
}
