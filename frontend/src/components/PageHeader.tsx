import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/** Inner-page header: breadcrumb, title and intro. */
export default function PageHeader({ eyebrow, title, text, crumb, children }: {
  eyebrow?: string; title: string; text?: string; crumb?: string; children?: ReactNode;
}) {
  return (
    <section className="border-b border-slate-100 bg-[linear-gradient(180deg,#eef6fd_0%,#ffffff_100%)]">
      <div className="container-x pt-6 pb-12 sm:pb-14">
        {crumb && (
          <nav className="mb-8 flex items-center gap-1 text-sm text-muted" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-ocean">Home</Link><ChevronRight className="size-4" /><span className="text-ink">{crumb}</span>
          </nav>
        )}
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="mt-3 max-w-3xl text-3xl leading-tight font-bold sm:text-4xl lg:text-[2.75rem]">{title}</h1>
        {text && <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{text}</p>}
        {children}
      </div>
    </section>
  );
}
