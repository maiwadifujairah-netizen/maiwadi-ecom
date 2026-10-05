import { AlertTriangle, Loader2, PackageOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { mediaUrl } from '../services/api';
import { cdnImage } from '../utils/format';

/** Shown when a product/banner image is missing or fails: the real MAI WADI can, never a broken icon. */
const FALLBACK = '/images/products/water-can.webp';

export function Spinner({ className = 'size-5' }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin`} aria-hidden="true" />;
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-muted" role="status">
      <Spinner /> <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center" role="alert">
      <AlertTriangle className="size-10 text-amber-500" />
      <p className="max-w-md text-sm text-muted">{message}</p>
      {onRetry && <button className="btn-outline btn-sm" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="rounded-full bg-mist p-4"><PackageOpen className="size-8 text-ocean" /></div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="max-w-md text-sm text-muted">{text}</p>}
      {action}
    </div>
  );
}

/** Image with a graceful fallback so a bad URL never shows a broken icon. */
export function Img({ src, alt, className = '', eager = false, product = false, width = 1200 }: {
  src?: string; alt: string; className?: string; eager?: boolean; product?: boolean; width?: number;
}) {
  return (
    <img
      src={cdnImage(mediaUrl(src), width, product) || FALLBACK}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      onError={(e) => {
        // Retry the untransformed URL once (in case a CDN transform fails), then fall back to the brand can.
        const img = e.currentTarget;
        const original = mediaUrl(src);
        if (original && !img.dataset.retried) { img.dataset.retried = '1'; img.src = original; }
        else if (!img.src.endsWith(FALLBACK)) img.src = FALLBACK;
      }}
    />
  );
}
