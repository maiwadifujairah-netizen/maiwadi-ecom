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

  const title = useFallback && !banner ? s.heroTitle || 'Pure water, delivered to your door' : banner!.title;
  const subtitle = useFallback && !banner
    ? s.heroSubtitle || 'MAI WADI purified drinking water in convenient water cans — order online and we bring it straight to your home or office.'
    : banner!.subtitle;
  // "Pure drinking water, delivered to your door" → white lead line + aqua accent line (split at the first comma)
  const comma = title.indexOf(',');
  const [titleLead, titleAccent] = comma > 0 ? [title.slice(0, comma + 1), title.slice(comma + 1).trim()] : [title, ''];
  const showTitle = banner ? banner.showTitle !== false : true;
  const showSubtitle = (banner ? banner.showSubtitle !== false : true) && Boolean(subtitle);
  const buttons = banner
    ? [
        { text: banner.buttonText, to: banner.buttonLink, primary: true },
        { text: banner.secondaryButtonText ?? '', to: banner.secondaryButtonLink ?? '', primary: false },
      ].filter((b) => banner.showButtons !== false && b.text && b.to)
    : [
        { text: 'Explore Products', to: '/products', primary: true },
        { text: 'Contact Us', to: '/contact', primary: false },
      ];

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
      {/* Dark scrim for legibility: top-down on mobile (text spans the width), left-to-right on desktop so the
          bottles and landscape on the right keep their full brightness. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(0_0_0/0.65)_0%,rgb(0_0_0/0.4)_45%,transparent_75%)] lg:bg-[linear-gradient(90deg,rgb(0_0_0/0.72)_0%,rgb(0_0_0/0.5)_28%,rgb(0_0_0/0.15)_50%,transparent_65%)]" />

      <div className="container-x flex h-full items-start pt-8 sm:pt-12 lg:pt-[3.6vw]">
        {/* Desktop: top-left, inside the free ~38% of the artwork left of the bottles. */}
        <div className="max-w-xl animate-fade-up text-white lg:max-w-[calc(38vw-max((100vw-80rem)/2,0px)-3.5rem)]">
          {showTitle
            ? <h1 className="text-[2rem] leading-[1.1] font-extrabold tracking-tight text-white [text-shadow:0_2px_12px_rgb(0_0_0/0.35)] sm:text-5xl lg:text-[clamp(2rem,2.9vw,3.5rem)]">{titleLead}{titleAccent && <><br /><span className="text-[#22D3EE]">{titleAccent}</span></>}</h1>
            : <h1 className="sr-only">{title}</h1>}
          {showSubtitle && <p className="mt-3 max-w-md text-[15px] leading-[1.6] font-medium text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.35)] sm:mt-5 sm:text-lg xl:max-w-lg xl:text-xl">{subtitle}</p>}
          {buttons.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3 sm:mt-8">
              {buttons.map((b) => (
                <CtaLink key={b.text} to={b.to} className={b.primary ? 'btn group rounded-xl bg-[#0EA5E9] px-7 py-3.5 text-base text-white shadow-lg shadow-sky-950/30 hover:bg-[#0284C7] hover:shadow-xl' : 'btn border border-ink/20 bg-white/70 px-7 py-3.5 text-base text-ink backdrop-blur-sm hover:bg-white'}>
                  {b.text} {b.primary && <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />}
                </CtaLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
