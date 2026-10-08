import { BadgeCheck, Heart, MapPin, ShieldCheck, Sparkles, Truck, Users } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';
import { useSite } from '../context/SiteContext';
import PageHeader from '../components/PageHeader';
import { DeliverySection, FacilityCard } from '../components/BrandSections';
import { ABOUT_IMAGE, MISSION_IMAGE, WATER_HERO } from '../utils/brand';

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
      <PageHeader crumb="About Us" eyebrow="About MAI WADI" title="Water as pure as you" text={`${s.siteName} — ${s.tagline || 'As pure as you'}.`} image={WATER_HERO} />

      {/* Glass trust strip overlapping the hero's lower edge. */}
      <div className="container-x relative z-10 mt-6 lg:-mt-16">
        <ul className="card grid grid-cols-2 gap-y-6 bg-white/85 p-6 backdrop-blur-md lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, label }, i) => (
            <li key={label} className={`group flex cursor-default flex-col items-center gap-2 px-3 text-center ${i ? 'lg:border-l lg:border-slate-100' : ''}`}>
              {/* Hover (mouse) or press (touch) fills the icon circle with brand blue. */}
              <span className="grid size-12 place-items-center rounded-full text-ocean transition-colors duration-300 group-hover:bg-ocean group-hover:text-white group-active:bg-ocean group-active:text-white">
                <Icon className="size-7" strokeWidth={1.75} />
              </span>
              <span className="text-sm font-semibold text-ink transition-colors duration-300 group-hover:text-ocean group-active:text-ocean">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      <section className="container-x section-y grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <img src={ABOUT_IMAGE} alt="MAI WADI 18.9L bottled drinking water can" width={1024} height={1535} loading="lazy" decoding="async"
          className="aspect-[3/4] w-full rounded-2xl object-cover object-[50%_50%] shadow-[0_8px_24px_-18px_rgb(11_30_71/0.35)] lg:aspect-auto lg:h-auto lg:object-contain" />
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

      {/* Facility and mission cards: side by side from lg, stacked below. */}
      <section className="bg-mist">
        <div className="container-x section-y grid gap-6 lg:grid-cols-2">
          <FacilityCard />
          {/* Water-drop photo fills the card and fades into navy, where the mission line sits. */}
          <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-[#0b2a63] shadow-[0_18px_48px_-28px_rgb(11_30_71/0.5)]">
            <div className="relative">
              <img src={MISSION_IMAGE} alt="MAI WADI water drop" width={716} height={656} loading="lazy" decoding="async" className="aspect-[716/656] w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent,#0b2a63_85%)] lg:h-2/5 lg:bg-[linear-gradient(180deg,transparent,#0b2a63)]" />
            </div>
            <div className="relative -mt-8 flex flex-1 flex-col justify-end px-6 pb-9 sm:-mt-12 lg:-mt-20 sm:px-8 sm:pb-10">
              <span className="eyebrow flex items-center gap-3 text-aqua">Our mission <span className="h-px w-10 bg-aqua" aria-hidden="true" /></span>
              <p className="mt-4 font-display text-xl leading-snug font-semibold text-white sm:text-2xl">{s.aboutMission || MISSION}</p>
            </div>
          </div>
        </div>
      </section>

      <DeliverySection />
    </>
  );
}
