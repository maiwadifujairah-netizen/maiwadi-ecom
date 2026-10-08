import { useId } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Building2, Droplet, House, MousePointerClick, ShieldCheck, Store, Truck, type LucideIcon } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { DELIVERY_BANNER_IMAGE, DELIVERY_SCENE_IMAGE, FACILITY_FLOOR_IMAGE, FACTORY_IMAGE, FILLING_LINE_IMAGE, HIGHLIGHTS } from '../utils/brand';

/** Same URL as the Home product list, so every product-image spot shares one cached request. */
export const FEATURED_URL = '/products?featured=true&limit=8';

const STRIP_ICONS: LucideIcon[] = [Droplet, ShieldCheck, Truck, MousePointerClick];
const STRIP_DEFAULT = ['Purified drinking water', 'Low sodium', 'Reliable delivery', 'Easy ordering'];

/**
 * Floating four-benefit card that overlaps the bottom of the hero; titles come from Admin → Settings → Features.
 * Icons share one fixed 1.75px line (absoluteStrokeWidth), so all four keep the same weight at every size.
 */
export function FeatureStrip() {
  const { settings } = useSite();
  const titles = settings.features.length ? settings.features.slice(0, 4).map((f) => f.title) : STRIP_DEFAULT;
  return (
    <div className="container-x relative z-10 -mt-8 sm:mt-6 lg:-mt-14">
      <ul className="grid grid-cols-2 rounded-2xl bg-white p-2 shadow-[0_18px_48px_-20px_rgb(11_30_71/0.28)] ring-1 ring-slate-100 sm:p-4 lg:grid-cols-4">
        {titles.map((t, i) => {
          const Icon = STRIP_ICONS[i % STRIP_ICONS.length];
          return (
            // Hover styles only apply on hover-capable pointers (Tailwind v4 `hover:`), so touch devices keep the clean default.
            // The icon halo uses a negative margin, so it adds no layout size: nothing shifts on hover.
            <li key={t} className={`p-1 ${i ? 'lg:border-l lg:border-slate-100' : ''} ${i % 2 ? 'border-l border-slate-100 lg:border-l' : ''} ${i > 1 ? 'border-t border-slate-100 lg:border-t-0' : ''}`}>
              <div tabIndex={0}
                className="group flex h-full flex-col items-center gap-3 rounded-xl px-3 py-4 text-center outline-none transition duration-300 ease-out hover:-translate-y-[3px] hover:bg-[#f5fbff] hover:shadow-[0_10px_28px_-16px_rgb(14_165_233/0.45)] focus-visible:-translate-y-[3px] focus-visible:bg-[#f5fbff] focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/60 motion-reduce:transform-none">
                <span className="-m-2 grid size-12 place-items-center rounded-full text-[#0EA5E9] transition duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:bg-[#e6f6fe] group-hover:text-[#0B1F4B] group-hover:shadow-[0_8px_20px_-8px_rgb(14_165_233/0.5)] group-focus-visible:-translate-y-0.5 group-focus-visible:scale-110 group-focus-visible:bg-[#e6f6fe] group-focus-visible:text-[#0B1F4B] sm:size-[52px]">
                  <Icon className="size-8 sm:size-9" strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
                </span>
                <span className="font-display text-sm font-semibold text-ink sm:text-base">{t}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Facility photo, shown whole-frame with a natural crop (object-cover on a fixed ratio). */
export function FactoryImage({ className = '', src = FACTORY_IMAGE }: { className?: string; src?: string }) {
  return (
    <img src={src} alt="MAI WADI purification and filling facility" loading="lazy" decoding="async"
      className={`w-full object-cover ${className}`} />
  );
}

const FACILITY_ICONS: LucideIcon[] = [Droplet, ShieldCheck, BadgeCheck, Truck];

/** About → facility card: full-width photo on top, white copy panel with the four highlights below. */
export function FacilityCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_18px_48px_-28px_rgb(11_30_71/0.35)] ring-1 ring-slate-100">
      <img src={FACILITY_FLOOR_IMAGE} alt="MAI WADI filling line with labelled water cans" width={1082} height={796} loading="lazy" decoding="async"
        className="aspect-[1082/796] w-full object-cover" />
      <div className="flex flex-1 flex-col px-6 py-7 sm:px-8 sm:py-8">
        <span className="eyebrow flex items-center gap-3">Our facility <span className="h-px w-10 bg-ocean" aria-hidden="true" /></span>
        <h2 className="mt-3 text-2xl leading-tight font-bold sm:text-[1.75rem]">Purified in Fujairah with care</h2>
        <p className="mt-3 leading-relaxed text-muted">Every MAI WADI can is filled at our own facility using advanced purification and careful quality control.</p>
        <ul className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {HIGHLIGHTS.map((h, i) => {
            const Icon = FACILITY_ICONS[i % FACILITY_ICONS.length];
            return (
              <li key={h} className="flex items-center gap-3 text-sm font-medium text-ink sm:text-[15px]">
                <Icon className="size-6 shrink-0 text-ocean" strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" /> {h}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Soft blue water wave for the bottom-left corner of the light banners (fades out to the right). */
export function WaterWave({ className = '' }: { className?: string }) {
  const id = useId();
  return (
    <svg aria-hidden="true" viewBox="0 0 600 220" preserveAspectRatio="none" className={`pointer-events-none absolute bottom-0 left-0 -z-10 ${className}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0b84d8" stopOpacity="0.5" />
          <stop offset="1" stopColor="#23a9ee" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id})`} d="M0 60c90 40 170 130 300 120s200-70 300-60v100H0z" />
      <path fill={`url(#${id})`} fillOpacity="0.4" d="M0 120c120 10 200 80 320 70s180-40 280-30v60H0z" />
    </svg>
  );
}

const SERVICES: { icon: LucideIcon; label: string }[] = [
  { icon: House, label: 'Home Delivery' },
  { icon: Building2, label: 'Office Supply' },
  { icon: Store, label: 'Restaurants' },
  { icon: Truck, label: 'On-time Delivery' },
];

export function DeliverySection() {
  const { settings: s } = useSite();
  return (
    <section className="container-x section-y">
      {/*
        White copy panel with a curved right edge laid over the photo's left edge (xl+), so the curve, not a fade, separates
        them; the photo fills the full height on the right. 16:7 card from lg (taller only if the copy needs it); below lg the photo is stacked on top at its own ratio.
      */}
      <div className="relative isolate overflow-hidden @container rounded-3xl bg-[linear-gradient(180deg,#ffffff_60%,#eaf4fc_100%)] shadow-[0_18px_48px_-28px_rgb(11_30_71/0.35)] ring-1 ring-ocean/10">
        {/* lg+: photo covers the right 60% (starting just under the curve tip) at full card height, so the worker stays visible. */}
        <div className="relative aspect-[864/678] lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[60%]">
          <img src={DELIVERY_BANNER_IMAGE} alt="MAI WADI team loading water cans beside the delivery truck" width={864} height={678} loading="lazy" decoding="async"
            className="size-full object-cover lg:object-[20%_60%]" />
        </div>
        {/* Curved white panel (lg+), its right edge an elliptical arc over the photo; the wave is clipped inside it. */}
        <div aria-hidden="true" className="absolute inset-y-0 left-0 isolate hidden w-[41%] overflow-hidden bg-[linear-gradient(160deg,#ffffff_55%,#eef6fd_100%)] shadow-[14px_0_40px_-22px_rgb(11_30_71/0.35)] [border-radius:0_9%_9%_0/0_50%_50%_0] lg:block">
          <WaterWave className="h-40 w-[75%]" />
        </div>
        <WaterWave className="h-36 w-[80%] lg:hidden" />
        <div className="relative px-6 pt-6 pb-10 sm:px-10 sm:pb-12 lg:flex lg:min-h-[43.75cqw] lg:w-[40%] lg:flex-col lg:justify-center lg:py-8 xl:px-12">
          <span className="eyebrow flex items-center gap-3">Delivery <span className="h-px w-10 bg-ocean" aria-hidden="true" /></span>
          <h2 className="section-title mt-3">Fresh water, delivered to <span className="text-ocean">your door</span></h2>
          <p className="mt-4 leading-relaxed text-muted lg:text-[15px] xl:text-base">{s.aboutDelivery || 'Our own delivery team brings MAI WADI water cans to homes and businesses across Fujairah.'}</p>
          <ul className="mt-6 grid grid-cols-4 divide-x divide-slate-200/80">
            {SERVICES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2 px-1 text-center">
                <span className="grid size-11 place-items-center rounded-full bg-mist text-ocean sm:size-12"><Icon className="size-5" strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" /></span>
                <span className="text-xs leading-tight font-medium text-ink sm:text-[13px]">{label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/products" className="btn-primary px-7">Order now <ArrowRight className="size-4" /></Link>
            <Link to="/contact" className="btn-outline px-7">Contact us</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Info cards: the facility for purification, the truck for delivery. */
export function ImageFeatures() {
  const { settings: s } = useSite();
  const delivery = s.features.find((f) => /deliver/i.test(f.title))?.text;
  const cards = [
    {
      title: 'Purified & certified', text: 'Advanced purification, low sodium, and quality that meets UAE.S/GSO standards.',
      media: <img src={FILLING_LINE_IMAGE} alt="MAI WADI cans on the purification and filling line" width={1555} height={1012} loading="lazy" decoding="async" className="size-full object-cover" />,
    },
    {
      title: 'Reliable delivery', text: delivery || 'Our own delivery fleet brings your water cans right to your doorstep.',
      media: <img src={DELIVERY_SCENE_IMAGE} alt="MAI WADI delivery truck with contact numbers 09 277 8993 and 050 908 7560" width={1280} height={720}
        loading="lazy" decoding="async" className="size-full object-cover" />,
    },
  ];
  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {cards.map((c) => (
        <li key={c.title} className="card overflow-hidden">
          <div className="media-panel aspect-[16/9] rounded-none ring-0">{c.media}</div>
          <div className="p-5 sm:p-6">
            <h3 className="text-lg font-bold">{c.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
