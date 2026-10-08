import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { Img } from './States';

const ZOOM_LEVELS = [1, 2, 3];

/**
 * Full-screen product image on a native modal <dialog> (Esc closes, focus stays inside). Click/tap steps through
 * ZOOM_LEVELS keeping the clicked point centred; zoomed views pan by scrolling, and phones can still pinch-zoom.
 */
function ImageLightbox({ src, alt, onClose }: { src?: string; alt: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState(0);
  const zoom = ZOOM_LEVELS[level];

  useEffect(() => {
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, []);

  const zoomTo = (next: number, fx = 0.5, fy = 0.5) => {
    setLevel(next);
    // After the resize renders, scroll so the chosen point (fractions of the image) sits mid-screen.
    requestAnimationFrame(() => {
      const s = scroller.current;
      if (s) s.scrollTo({ left: fx * s.scrollWidth - s.clientWidth / 2, top: fy * s.scrollHeight - s.clientHeight / 2 });
    });
  };

  const btn = 'grid size-11 place-items-center rounded-full bg-white text-ink shadow-md ring-1 ring-slate-200 transition hover:text-ocean disabled:opacity-40';
  return (
    <dialog ref={dialog} onClose={onClose} aria-label={alt}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-[linear-gradient(180deg,#ffffff_0%,#eef6fd_100%)] p-0">
      <div ref={scroller} className="flex size-full overflow-auto p-4 sm:p-8">
        <div className="m-auto shrink-0" style={{ height: `${zoom * 100}%`, width: zoom === 1 ? '100%' : 'auto' }}>
          <Img src={src} alt={alt} eager product width={2400}
            className={zoom === 1 ? 'size-full cursor-zoom-in object-contain' : `h-full w-auto max-w-none ${level < ZOOM_LEVELS.length - 1 ? 'cursor-zoom-in' : 'cursor-zoom-out'}`}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              zoomTo((level + 1) % ZOOM_LEVELS.length, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
            }} />
        </div>
      </div>
      <div className="fixed top-4 right-4 flex gap-2 sm:top-6 sm:right-6">
        <button type="button" className={btn} onClick={() => zoomTo(level - 1)} disabled={level === 0} aria-label="Zoom out"><ZoomOut className="size-5" /></button>
        <button type="button" className={btn} onClick={() => zoomTo(level + 1)} disabled={level === ZOOM_LEVELS.length - 1} aria-label="Zoom in"><ZoomIn className="size-5" /></button>
        <button type="button" className={btn} onClick={() => dialog.current?.close()} aria-label="Close" autoFocus><X className="size-5" /></button>
      </div>
    </dialog>
  );
}

/**
 * Product image panel: hover (pointer devices only) magnifies 2× around the cursor; click/tap opens the lightbox.
 * `className` sizes the panel; `children` are overlays such as the stock badge.
 */
export default function ZoomableImage({ src, alt, eager = false, className = '', children }: {
  src?: string; alt: string; eager?: boolean; className?: string; children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Enlarge image of ${alt}`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
          e.currentTarget.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
        }}
        // 2:3 frame = the official can photo's own ratio, so object-contain fills it edge to edge without cropping.
        className={`media-panel group block aspect-[2/3] w-full cursor-zoom-in ${className}`}>
        <Img src={src} alt={alt} eager={eager} product
          className="product-img origin-[var(--zx,50%)_var(--zy,50%)] transition-transform duration-300 ease-out group-hover:scale-[2]" />
        <span aria-hidden="true" className="absolute right-3 bottom-3 grid size-10 place-items-center rounded-full bg-white/90 text-ocean shadow-md ring-1 ring-ocean/10 transition group-hover:opacity-0">
          <ZoomIn className="size-5" />
        </span>
        {children}
      </button>
      {open && <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
