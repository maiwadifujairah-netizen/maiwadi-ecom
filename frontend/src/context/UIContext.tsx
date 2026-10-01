import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type Toast = { id: number; type: 'success' | 'error'; message: string };
type ConfirmOpts = { title: string; message?: string; confirmText?: string; danger?: boolean };

interface UIValue {
  toast: (message: string, type?: Toast['type']) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
}
const UIContext = createContext<UIValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<ConfirmOpts | null>(null);
  const resolver = useRef<(v: boolean) => void>(undefined);

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const confirm = useCallback((opts: ConfirmOpts) => {
    setDialog(opts);
    return new Promise<boolean>((res) => (resolver.current = res));
  }, []);

  const close = (v: boolean) => {
    resolver.current?.(v);
    setDialog(null);
  };

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:right-4 sm:left-auto sm:items-end" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 text-sm shadow-xl">
            {t.type === 'success' ? <CheckCircle2 className="size-5 shrink-0 text-emerald-500" /> : <AlertCircle className="size-5 shrink-0 text-red-500" />}
            <p className="flex-1 text-ink">{t.message}</p>
            <button onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} aria-label="Dismiss" className="text-slate-400 hover:text-ink">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
      {dialog && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => close(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md animate-fade-up rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="confirm-title" className="text-lg font-semibold">{dialog.title}</h2>
            {dialog.message && <p className="mt-2 text-sm text-muted">{dialog.message}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-outline btn-sm" onClick={() => close(false)}>Cancel</button>
              <button autoFocus className={`${dialog.danger ? 'btn-danger' : 'btn-primary'} btn-sm`} onClick={() => close(true)}>
                {dialog.confirmText ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext)!;
