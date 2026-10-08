import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Inner-page header: breadcrumb, title and intro. With `image`, a wide scene sits on the right (lg+, its left edge fading into
 * the light background so the copy stays clean) and stacks under the copy on smaller screens.
 */
export default function PageHeader({ eyebrow, title, text, crumb, image, children }: {
  eyebrow?: string; title: string; text?: string; crumb?: string; image?: { src: string; alt: string; width: number; height: number }; children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-slate-100 bg-[radial-gradient(ellipse_at_88%_10%,rgb(35_169_238/0.22)_0%,transparent_50%),radial-gradient(ellipse_at_70%_120%,rgb(11_132_216/0.12)_0%,transparent_55%),linear-gradient(180deg,#eef6fd_0%,#ffffff_100%)]">
      <svg aria-hidden="true" viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 -z-10 h-16 w-full text-ocean/[0.06] sm:h-24">
        <path fill="currentColor" d="M0 64c160 40 320 40 480 8s320-64 480-40 320 72 480 56v32H0z" />
      </svg>
      <div className={`container-x pt-6 pb-12 sm:pb-14 ${image ? 'lg:flex lg:min-h-[26rem] lg:flex-col lg:items-start lg:justify-center lg:pb-16' : ''}`}>
        {crumb && (
          <nav className="mb-8 flex items-center gap-1 text-sm font-medium text-muted" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-ocean">Home</Link><ChevronRight className="size-4" /><span className="text-ink">{crumb}</span>
          </nav>
        )}
        {eyebrow && <span className="eyebrow rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-ocean/10">{eyebrow}</span>}
        <h1 className="mt-4 max-w-3xl text-[2rem] leading-[1.1] font-extrabold sm:text-[2.5rem] lg:text-[3.25rem]">{title}</h1>
        {text && <p className={`mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg ${image ? 'lg:max-w-xl' : ''}`}>{text}</p>}
        {children}
      </div>
      {image && (
        <img src={image.src} alt={image.alt} width={image.width} height={image.height} fetchPriority="high" decoding="async"
          className="-mt-4 aspect-[4/3] w-full object-cover object-[62%_50%] sm:aspect-[16/9] [mask-image:linear-gradient(180deg,transparent,#000_22%)] lg:absolute lg:inset-y-0 lg:right-0 lg:-z-10 lg:mt-0 lg:aspect-auto lg:h-full lg:w-[64%] lg:object-[60%_50%] lg:[mask-image:linear-gradient(90deg,transparent,#000_30%)]" />
      )}
    </section>
  );
}
