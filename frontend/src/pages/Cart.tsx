import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';
import { useCart } from '../context/CartContext';
import { useSite } from '../context/SiteContext';
import QuantitySelector from '../components/QuantitySelector';
import { EmptyState, Img } from '../components/States';

export default function Cart() {
  useMeta('Your cart');
  const { items, subtotal, update, remove } = useCart();
  const { money, settings } = useSite();

  if (!items.length)
    return (
      <div className="container-x py-16">
        <EmptyState title="Your cart is empty" text="Add some fresh water to get started." action={<Link to="/products" className="btn-primary mt-2">Browse products</Link>} />
      </div>
    );

  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="text-4xl font-bold">Your cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-slate-100 rounded-3xl border border-slate-100">
          {items.map((i) => (
            <li key={i.productId} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <Link to={`/products/${i.slug}`} className="size-24 shrink-0 overflow-hidden rounded-2xl bg-mist">
                <Img src={i.image} alt={i.name} product width={200} className="size-full object-contain p-2 mix-blend-multiply" />
              </Link>
              <div className="flex-1">
                <Link to={`/products/${i.slug}`} className="font-semibold hover:text-ocean">{i.name}</Link>
                <p className="text-sm text-muted">{money(i.price)} each</p>
                {i.quantity >= i.stock && <p className="text-xs text-amber-700">Maximum available quantity</p>}
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <QuantitySelector size="sm" value={i.quantity} max={i.stock} onChange={(q) => update(i.productId, q)} />
                <p className="w-24 text-right font-semibold">{money(i.price * i.quantity)}</p>
                <button onClick={() => remove(i.productId)} className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${i.name}`}>
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit rounded-3xl bg-mist p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold">{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="font-semibold">{settings.deliveryFee > 0 ? money(settings.deliveryFee) : 'Free'}</dd></div>
            <div className="flex justify-between border-t border-ocean/10 pt-3 text-base"><dt className="font-semibold">Total</dt><dd className="font-display text-xl font-bold text-deep">{money(subtotal + settings.deliveryFee)}</dd></div>
          </dl>
          <Link to="/checkout" className="btn-primary mt-6 w-full">Checkout <ArrowRight className="size-4" /></Link>
          <Link to="/products" className="btn-ghost mt-2 w-full"><ShoppingBag className="size-4" /> Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
