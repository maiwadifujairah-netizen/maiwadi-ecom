import type { ReactNode } from 'react';

export function AdminHeader({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-ocean' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : ''}`} />
      </button>
      {label}
    </label>
  );
}

export const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wider text-muted uppercase';
export const td = 'px-4 py-3 text-sm';
