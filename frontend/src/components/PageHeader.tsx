import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/** Inner-page header: breadcrumb, title and intro. */
export default function PageHeader({ eyebrow, title, text, crumb, children }: {
  eyebrow?: string; title: string; text?: string; crumb?: string; children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-slate-100 bg-[radial-gradient(ellipse_at_88%_10%,rgb(35_169_238/0.22)_0%,transparent_50%),radial-gradient(ellipse_at_70%_120%,rgb(11_132_216/0.12)_0%,transparent_55%),linear-gradient(180deg,#eef6fd_0%,#ffffff_100%)]">
      <svg aria-hidden="true" viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 -z-10 h-16 w-full text-ocean/[0.06] sm:h-24">
        <path fill="currentColor" d="M0 64c160 40 320 40 480 8s320-64 480-40 320 72 480 56v32H0z" />
      </svg>
      <div className="container-x pt-6 pb-12 sm:pb-14">
        {crumb && (
          <nav className="mb-8 flex items-center gap-1 text-sm text-muted" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-ocean">Home</Link><ChevronRight className="size-4" /><span className="text-ink">{crumb}</span>
          </nav>
        )}
        {eyebrow && <span className="eyebrow rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-ocean/10">{eyebrow}</span>}
        <h1 className="mt-4 max-w-3xl text-3xl leading-tight font-bold sm:text-4xl lg:text-[2.75rem]">{title}</h1>
        {text && <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{text}</p>}
        {children}
      </div>
    </section>
  );
}
