import { BadgeCheck, Heart, MapPin, ShieldCheck, Sparkles, Truck, Users } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';
import { useSite } from '../context/SiteContext';
import PageHeader from '../components/PageHeader';
import { DeliverySection, FacilitySection } from '../components/BrandSections';

const TRUST = [
  { icon: MapPin, label: 'Purified in Fujairah' },
  { icon: BadgeCheck, label: 'UAE.S/GSO standards' },
  { icon: Truck, label: 'Reliable delivery' },
  { icon: Users, label: 'Trusted by families & businesses' },
];
const VALUE_ICONS = [Sparkles, ShieldCheck, Heart];
const MISSION = 'To make clean, great-tasting drinking water easy to get — with honest service, dependable delivery and care in every can.';

export default function About() {
  const { settings: s } = useSite();
  useMeta('About Us', 'Learn about MAI WADI — purified drinking water delivered to homes and businesses.');
  return (
    <>
      <PageHeader crumb="About Us" eyebrow="About MAI WADI" title="Water as pure as you" text={`${s.siteName} — ${s.tagline || 'As pure as you'}.`} />

      <div className="container-x pt-10">
        <ul className="card grid grid-cols-2 gap-y-6 p-6 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, label }, i) => (
            <li key={label} className={`flex flex-col items-center gap-2.5 px-3 text-center ${i ? 'lg:border-l lg:border-slate-100' : ''}`}>
              <Icon className="size-7 text-ocean" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-ink">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      <section className="container-x section-y grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <img src="/images/truck-full.jpg" alt="MAI WADI delivery truck" width={1611} height={2150} loading="lazy" decoding="async"
          className="mx-auto h-auto w-full max-w-md rounded-2xl object-contain shadow-[0_8px_24px_-18px_rgb(11_30_71/0.35)] lg:max-w-none" />
        <div>
          <span className="eyebrow">Who we are</span>
          <h2 className="section-title mt-3">A Fujairah water brand you can rely on</h2>
          <p className="mt-5 text-lg leading-relaxed whitespace-pre-line text-muted">{s.aboutIntro}</p>
          {s.aboutValues.length > 0 && (
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {s.aboutValues.map((v, i) => {
                const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
                return (
                  <li key={i} className="card p-5">
                    <span className="icon-tile size-10"><Icon className="size-5" /></span>
                    <p className="mt-3 font-display font-bold">{v.title}</p>
                    <p className="mt-1 text-sm text-muted">{v.text}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <FacilitySection />

      <section className="container-x pt-16 sm:pt-20">
        <div className="rounded-2xl bg-ink px-6 py-12 text-center sm:px-12 sm:py-16">
          <span className="eyebrow text-aqua">Our mission</span>
          <p className="mx-auto mt-4 max-w-3xl font-display text-2xl leading-snug font-semibold text-white sm:text-3xl">{s.aboutMission || MISSION}</p>
        </div>
      </section>

      <DeliverySection />
    </>
  );
}
