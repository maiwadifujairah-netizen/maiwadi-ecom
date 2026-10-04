import { useState, type CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Banner, BannerPosition } from '../types';
import { useSite } from '../context/SiteContext';
import { mediaUrl } from '../services/api';
import { cdnImage } from '../utils/format';
import CtaLink from './CtaLink';

const POSITION: Record<BannerPosition, string> = {
  center: '50% 50%', top: '50% 0%', bottom: '50% 100%', left: '0% 50%', right: '100% 50%',
};

/** Brand default shown until an admin publishes a hero banner (or if the banner image fails to load). */
const FALLBACK_IMAGE = '/images/truck.jpg';

// Fixed height per breakpoint so the page never shifts while the image loads.
// Desktop follows the 5:2 banner artwork so the centred bottles are never cropped away.
const HEIGHT = 'h-[85svh] min-h-[520px] max-h-[760px] lg:h-auto lg:min-h-0 lg:aspect-[5/2]';

const srcSet = (src: string, widths: number[]) =>
  src.includes('res.cloudinary.com/') ? widths.map((w) => `${cdnImage(src, w)} ${w}w`).join(', ') : undefined;

export default function HeroBanner({ banner, loading }: { banner: Banner | null; loading: boolean }) {
  const { settings: s } = useSite();
  const [failed, setFailed] = useState(false);

  if (loading) return <div className={`${HEIGHT} w-full animate-pulse bg-gradient-to-br from-mist via-white to-aqua/10`} aria-hidden="true" />;

  const useFallback = !banner || failed;
  const desktop = useFallback ? FALLBACK_IMAGE : mediaUrl(banner.image)!;
  const mobile = useFallback ? undefined : mediaUrl(banner.mobileImage) || undefined;

  // The banner artwork already carries its own headline, so only an sr-only h1 and one CTA are rendered on top.
  const title = banner?.title || s.heroTitle || 'Pure water, delivered to your door';
  const cta = banner
    ? (banner.showButtons !== false && banner.buttonText && banner.buttonLink ? { text: banner.buttonText, to: banner.buttonLink } : null)
    : { text: 'Explore Products', to: '/products' };

  const pos = {
    '--pos-d': POSITION[(!useFallback && banner?.desktopPosition) || 'center'],
    '--pos-m': POSITION[(!useFallback && banner?.mobilePosition) || 'center'],
  } as CSSProperties;

  return (
    <section className={`relative isolate w-full overflow-hidden bg-mist ${HEIGHT}`} aria-label="Featured">
      <picture>
        {mobile && <source media="(max-width: 1023px)" srcSet={srcSet(mobile, [640, 828, 1080]) ?? mobile} sizes="100vw" />}
        <img
          src={cdnImage(desktop, 1920)}
          srcSet={srcSet(desktop, [1280, 1920, 2560])}
          sizes="100vw"
          alt={title}
          fetchPriority="high"
          decoding="async"
          onError={() => setFailed(true)}
          style={pos}
          className="absolute inset-0 -z-10 size-full object-cover object-[var(--pos-m)] lg:object-[var(--pos-d)]"
        />
      </picture>
      <h1 className="sr-only">{title}</h1>
      {cta && (
        <div className="container-x flex h-full items-end pb-10 sm:pb-14 lg:pb-[4vw]">
          <CtaLink to={cta.to} className="btn group rounded-xl bg-ocean px-6 py-3 text-sm text-white shadow-lg shadow-sky-950/25 hover:bg-deep sm:text-base">
            {cta.text} <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </CtaLink>
        </div>
      )}
    </section>
  );
}
