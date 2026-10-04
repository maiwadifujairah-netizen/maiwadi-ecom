export default function StockBadge({ stock, price }: { stock: number; price: number }) {
  if (price <= 0) return <span className="badge bg-white/90 text-muted shadow-sm">Price coming soon</span>;
  if (stock <= 0) return <span className="badge bg-red-50 text-red-600 shadow-sm">Out of stock</span>;
  if (stock <= 10) return <span className="badge bg-[#fff1e6] text-[#e86a12] shadow-sm">Only {stock} left</span>;
  return <span className="badge bg-emerald-50 text-emerald-700 shadow-sm">In stock</span>;
}
