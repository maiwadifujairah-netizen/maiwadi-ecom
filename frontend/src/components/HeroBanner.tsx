import { useState, type CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Banner, BannerPosition } from '../types';
import { useSite } from '../context/SiteContext';
import { mediaUrl } from '../services/api';
import { cdnImage } from '../utils/format';
import CtaLink from './CtaLink';
import { DELIVERY_IMAGE } from '../utils/brand';

const POSITION: Record<BannerPosition, string> = {
  center: '50% 50%', top: '50% 0%', bottom: '50% 100%', left: '0% 50%', right: '100% 50%',
};

/**
 * Brand default shown while the banner request is in flight (the free-tier API can take ~50 s to wake), when no
 * hero banner is published, or if the banner image fails. Never a blank block.
 */
const FALLBACK_IMAGE = DELIVERY_IMAGE;

const srcSet = (src: string, widths: number[]) =>
  src.includes('res.cloudinary.com/') ? widths.map((w) => `${cdnImage(src, w)} ${w}w`).join(', ') : undefined;

const BTN = 'btn group rounded-xl px-6 py-3 text-sm shadow-lg shadow-sky-950/25 sm:text-base';

/**
 * Image-first hero: the banner artwork carries its own logo and headline, so HTML adds only an sr-only h1 and
 * the CTA buttons an admin configured. Desktop shows the full artwork at its natural ratio (nothing cropped);
 * phones use the portrait mobile image when there is one, otherwise the same full desktop artwork.
 */
export default function HeroBanner({ banner }: { banner: Banner | null }) {
  const { settings: s } = useSite();
  // 0 = banner images, 1 = mobile image failed → desktop image everywhere, 2 = desktop failed too → brand fallback.
  const [failures, setFailures] = useState(0);
  // Phones: the frame takes the mobile image's own aspect ratio (read on load), so the whole artwork shows uncropped.
  const [mobileRatio, setMobileRatio] = useState(9 / 16);

  const desktopSrc = mediaUrl(banner?.image);
  const mobileSrc = mediaUrl(banner?.mobileImage);
  const useFallback = !desktopSrc || failures >= (mobileSrc ? 2 : 1);
  const desktop = useFallback ? FALLBACK_IMAGE : desktopSrc;
  const mobile = useFallback || failures ? undefined : mobileSrc;

  const title = banner?.title || s.heroTitle || 'Pure water, delivered to your door';
  const buttons = banner
    ? (banner.showButtons === false ? [] : [
        { text: banner.buttonText, to: banner.buttonLink, primary: true },
        { text: banner.secondaryButtonText, to: banner.secondaryButtonLink, primary: false },
      ].filter((b): b is { text: string; to: string; primary: boolean } => Boolean(b.text?.trim() && b.to?.trim())))
    : [{ text: 'Explore Products', to: '/products', primary: true }];

  const pos = {
    '--m-ratio': String(mobileRatio),
    '--pos-d': POSITION[(!useFallback && banner?.desktopPosition) || 'center'],
    '--pos-m': POSITION[(!useFallback && banner?.mobilePosition) || 'center'],
  } as CSSProperties;

  // Below 640px the portrait mobile image fills a frame of its own aspect ratio; from 640px the wide artwork is shown at
  // its natural ratio. Neither is cropped (object-position only matters for the instant before the ratio is known).
  const frame = mobile ? 'aspect-[var(--m-ratio)] sm:aspect-auto' : '';
  const img = mobile
    ? 'absolute inset-0 size-full object-cover object-[var(--pos-m)] sm:static sm:block sm:h-auto sm:object-contain'
    : 'block h-auto w-full';

  return (
    <section className="relative isolate w-full bg-mist" aria-label="Featured">
      <div className={`relative overflow-hidden ${frame}`} style={pos}>
        <picture>
          {mobile && <source media="(max-width: 639px)" srcSet={srcSet(mobile, [640, 828, 1080]) ?? mobile} sizes="100vw" />}
          <img
            src={cdnImage(desktop, 1920)}
            srcSet={srcSet(desktop, [1280, 1920, 2560])}
            sizes="100vw"
            width={1920}
            height={720}
            alt={title}
            fetchPriority="high"
            decoding="async"
            onError={() => setFailures((f) => f + 1)}
            onLoad={(e) => {
              const im = e.currentTarget;
              if (mobile && matchMedia('(max-width: 639px)').matches && im.naturalWidth) setMobileRatio(im.naturalWidth / im.naturalHeight);
            }}
            className={`-z-10 ${img} sm:object-[var(--pos-d)]`}
          />
        </picture>
      </div>
      <h1 className="sr-only">{title}</h1>
      {buttons.length > 0 && (
        // Over the tall portrait image and on large screens; below the short wide artwork in between so no artwork is covered.
        <div className={`container-x flex flex-wrap gap-3 ${mobile ? 'absolute inset-x-0 bottom-0 pb-16 sm:static sm:pt-5 sm:pb-0' : 'pt-5 pb-14 sm:pb-0'} lg:absolute lg:inset-x-0 lg:bottom-0 lg:pt-0 lg:pb-[6vw]`}>
          {buttons.map((b) => (
            <CtaLink key={b.to + b.text} to={b.to}
              className={`${BTN} ${b.primary ? 'bg-ocean text-white hover:bg-deep' : 'bg-white/95 text-deep hover:bg-white'}`}>
              {b.text} {b.primary && <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />}
            </CtaLink>
          ))}
        </div>
      )}
    </section>
  );
}
