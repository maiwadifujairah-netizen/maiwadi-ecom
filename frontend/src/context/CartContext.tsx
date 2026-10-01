import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product } from '../types';

export interface CartItem { productId: string; slug: string; name: string; price: number; image: string; stock: number; quantity: number }

interface CartValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (p: Product, qty?: number) => void;
  update: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}
const CartContext = createContext<CartValue | null>(null);
const KEY = 'mw_cart';

function load(): CartItem[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
  }, [items]);

  const add = (p: Product, qty = 1) =>
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === p._id);
      const quantity = Math.min(p.stock, (existing?.quantity ?? 0) + qty);
      const item = { productId: p._id, slug: p.slug, name: p.name, price: p.price, image: p.images[0] ?? '', stock: p.stock, quantity };
      return existing ? prev.map((i) => (i.productId === p._id ? item : i)) : [...prev, item];
    });

  const update = (productId: string, qty: number) =>
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(i.stock, qty)) } : i)));

  const remove = (productId: string) => setItems((prev) => prev.filter((i) => i.productId !== productId));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;

  return <CartContext.Provider value={{ items, count, subtotal, add, update, remove, clear }}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext)!;
