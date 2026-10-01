export default function StockBadge({ stock, price }: { stock: number; price: number }) {
  if (price <= 0) return <span className="badge bg-slate-100 text-muted">Price coming soon</span>;
  if (stock <= 0) return <span className="badge bg-red-50 text-red-600">Out of stock</span>;
  if (stock <= 10) return <span className="badge bg-amber-50 text-amber-700">Only {stock} left</span>;
  return <span className="badge bg-emerald-50 text-emerald-700">In stock</span>;
}
