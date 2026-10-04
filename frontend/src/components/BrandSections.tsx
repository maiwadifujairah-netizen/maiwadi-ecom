import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Clock, Droplet, FlaskConical, ShieldCheck, Truck, type LucideIcon } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { CAN_IMAGE, HIGHLIGHTS } from '../utils/brand';

/** The real MAI WADI can, never cropped or stretched. */
export function CanVisual({ className = '', eager = false }: { className?: string; eager?: boolean }) {
  return (
    <div className={`relative items-center justify-center ${className.includes('hidden') ? '' : 'flex'} ${className}`}>
      <img src={CAN_IMAGE} alt="MAI WADI water can" width={882} height={1566} loading={eager ? 'eager' : 'lazy'} decoding="async"
        className="relative h-[92%] w-auto object-contain mix-blend-multiply" />
    </div>
  );
}

/** Light product panel with the full can centred. */
export function CanPanel({ className = '' }: { className?: string }) {
  return (
    <div className={`media-panel aspect-square w-full ${className}`}>
      <div className="absolute inset-0 py-10 sm:py-12"><CanVisual className="size-full" /></div>
    </div>
  );
}

const TRUST: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Droplet, title: 'Pure & safe', text: 'Advanced purification' },
  { icon: BadgeCheck, title: 'Certified quality', text: 'Meets UAE.S/GSO standards' },
  { icon: Truck, title: 'Reliable delivery', text: 'Across Fujairah' },
  { icon: Clock, title: 'Easy ordering', text: 'Online, call or WhatsApp' },
];

/** Overlapping benefits strip directly under the hero. */
export function TrustStrip() {
  return (
    <div className="border-b border-slate-100">
      <ul className="container-x grid grid-cols-2 gap-y-6 py-6 sm:py-8 lg:grid-cols-4">
        {TRUST.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className={`flex items-center gap-3 sm:px-4 ${i ? 'lg:border-l lg:border-slate-100' : 'lg:pl-0'}`}>
            <span className="icon-tile size-11 rounded-xl"><Icon className="size-5" strokeWidth={1.9} /></span>
            <span>
              <span className="block font-display text-[15px] font-bold text-ink">{title}</span>
              <span className="block text-xs text-muted sm:text-sm">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const FEATURE_ICONS = [Droplet, ShieldCheck, Truck, FlaskConical];

/** "Why choose" cards, driven by Admin → Settings → Features with brand highlights as fallback. */
export function FeatureCards({ className = 'sm:grid-cols-2 lg:grid-cols-4' }: { className?: string }) {
  const { settings } = useSite();
  const cards = settings.features.length ? settings.features : HIGHLIGHTS.map((h) => ({ title: h, text: '' }));
  return (
    <ul className={`grid gap-4 ${className}`}>
      {cards.slice(0, 4).map((c, i) => {
        const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
        return (
          <li key={c.title} className="card p-6">
            <span className="icon-tile"><Icon className="size-5" /></span>
            <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
            {c.text && <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.text}</p>}
          </li>
        );
      })}
    </ul>
  );
}

export function FacilitySection() {
  return (
    <section className="bg-mist">
      <div className="container-x section-y grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <CanPanel />
        <div>
          <span className="eyebrow">Our facility</span>
          <h2 className="section-title mt-3">Purified in Fujairah with care</h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">Every MAI WADI can is filled at our own facility using advanced purification and careful quality control.</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-3 rounded-xl bg-white p-4 text-sm font-semibold text-ink ring-1 ring-slate-200/70">
                <ShieldCheck className="size-5 shrink-0 text-ocean" /> {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function DeliverySection() {
  const { settings: s } = useSite();
  return (
    <section className="container-x section-y">
      <div className="relative isolate grid items-center overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#0b2350_0%,#0a4f94_100%)] lg:grid-cols-2">
        <div className="px-6 py-12 text-white sm:px-12 sm:py-16">
          <span className="eyebrow text-aqua">Delivery</span>
          <h2 className="mt-3 text-3xl leading-tight font-bold text-white sm:text-4xl">Fresh water, delivered to your door</h2>
          <p className="mt-4 max-w-md leading-relaxed text-white/80">{s.aboutDelivery || 'Our own delivery team brings MAI WADI water cans to homes and businesses across Fujairah.'}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products" className="btn-white">Order now <ArrowRight className="size-4" /></Link>
            <Link to="/contact" className="btn border border-white/40 text-white hover:bg-white/10">Contact us</Link>
          </div>
        </div>
        <img src="/images/truck.jpg" alt="MAI WADI delivery truck" loading="lazy" decoding="async"
          className="h-64 w-full object-cover sm:h-80 lg:h-full lg:[mask-image:linear-gradient(90deg,transparent,black_30%)]" />
      </div>
    </section>
  );
}
