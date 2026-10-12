import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export type HeroCan = { src: string; alt: string; width: number; height: number };

/**
 * Inner-page header: breadcrumb, title and intro. With `can`, a compact premium band (soft blue gradient, light and
 * a thin ring behind the cut-out can on the right). Without it, a plain light band.
 */
export default function PageHeader({ eyebrow, title, text, crumb, can, children }: {
  eyebrow?: string; title: ReactNode; text?: string; crumb?: string; can?: HeroCan; children?: ReactNode;
}) {
  if (!can) {
    return (
      <section className="relative isolate overflow-hidden border-b border-slate-100 bg-[radial-gradient(ellipse_at_88%_10%,rgb(35_169_238/0.22)_0%,transparent_50%),radial-gradient(ellipse_at_70%_120%,rgb(11_132_216/0.12)_0%,transparent_55%),linear-gradient(180deg,#eef6fd_0%,#ffffff_100%)]">
        <svg aria-hidden="true" viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 -z-10 h-16 w-full text-ocean/[0.06] sm:h-24">
          <path fill="currentColor" d="M0 64c160 40 320 40 480 8s320-64 480-40 320 72 480 56v32H0z" />
        </svg>
        <div className="container-x pt-6 pb-12 sm:pb-14"><Copy {...{ eyebrow, title, text, crumb }}>{children}</Copy></div>
      </section>
    );
  }
  return (
    <section className="relative isolate overflow-hidden border-b border-slate-100 bg-[linear-gradient(110deg,#f7fbff_0%,#eef7fe_45%,#d9edfc_100%)]">
      {/* One faint wave line along the bottom. */}
      <svg aria-hidden="true" viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 -z-10 h-14 w-full text-ocean/[0.07]">
        <path fill="currentColor" d="M0 64c160 40 320 40 480 8s320-64 480-40 320 72 480 56v32H0z" />
      </svg>

      <div className="container-x relative grid items-center gap-4 pt-6 pb-8 lg:min-h-[20rem] lg:grid-cols-[1fr_auto] lg:gap-10 lg:py-6">
        <div className="min-w-0">
          <Copy {...{ eyebrow, title, text, crumb }} accent>{children}</Copy>
        </div>
        {/* Can with a soft light and one thin ring centred behind it. */}
        <div className="relative mx-auto lg:mr-[10%]">
          <div aria-hidden="true" className="absolute top-1/2 left-1/2 -z-10 size-[24rem] -translate-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_255_255/0.95)_0%,rgb(255_255_255/0)_65%)]" />
          <div aria-hidden="true" className="absolute top-1/2 left-1/2 -z-10 hidden size-[19rem] -translate-1/2 rounded-full border border-ocean/10 lg:block" />
          <img src={can.src} alt={can.alt} width={can.width} height={can.height} fetchPriority="high" decoding="async"
            className="w-24 drop-shadow-[0_18px_24px_rgb(11_30_71/0.3)] sm:w-28 lg:w-36" />
        </div>
      </div>
    </section>
  );
}

function Copy({ eyebrow, title, text, crumb, accent, children }: {
  eyebrow?: string; title: ReactNode; text?: string; crumb?: string; accent?: boolean; children?: ReactNode;
}) {
  return (
    <>
      {crumb && (
        <nav className="mb-8 flex items-center gap-1 text-sm font-medium text-muted" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-ocean">Home</Link><ChevronRight className="size-4" /><span className="text-ink">{crumb}</span>
        </nav>
      )}
      {eyebrow && <span className="eyebrow rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-ocean/10">{eyebrow}</span>}
      <h1 className="mt-4 max-w-3xl text-[2rem] leading-[1.1] font-extrabold sm:text-[2.5rem] lg:text-[3.25rem]">{title}</h1>
      {accent && <span aria-hidden="true" className="mt-5 block h-1 w-16 rounded-full bg-[linear-gradient(90deg,#0b84d8,#23a9ee)]" />}
      {text && <p className={`mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg ${accent ? 'lg:max-w-xl' : ''}`}>{text}</p>}
      {children}
    </>
  );
}
