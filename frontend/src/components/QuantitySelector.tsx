import { Minus, Plus } from 'lucide-react';

export default function QuantitySelector({ value, max, onChange, size = 'md' }: { value: number; max: number; onChange: (v: number) => void; size?: 'sm' | 'md' }) {
  const btn = size === 'sm' ? 'size-8' : 'size-11';
  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white">
      <button type="button" className={`${btn} grid place-items-center rounded-full text-deep hover:bg-mist disabled:opacity-40`} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <Minus className="size-4" />
      </button>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.min(max, Number(e.target.value) || 1)))}
        className="w-10 appearance-none bg-transparent text-center text-sm font-semibold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Quantity"
      />
      <button type="button" className={`${btn} grid place-items-center rounded-full text-deep hover:bg-mist disabled:opacity-40`} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
