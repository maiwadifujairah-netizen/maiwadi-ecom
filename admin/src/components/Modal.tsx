import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:py-10">
      <div role="dialog" aria-modal="true" aria-label={title} className={`my-auto w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} animate-fade-up rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-mist hover:text-ink" aria-label="Close"><X className="size-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
