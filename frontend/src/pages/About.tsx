import { Link } from 'react-router-dom';
import { CheckCircle2, Factory, Heart, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';
import { useSite } from '../context/SiteContext';
import PageHeader from '../components/PageHeader';

const ICONS = [Sparkles, ShieldCheck, Heart];

export default function About() {
  const { settings: s } = useSite();
  useMeta('About Us', 'Learn about MAI WADI — purified drinking water delivered to homes and businesses.');
  return (
    <>
      <PageHeader eyebrow="About us" title="Water as pure as you" text={s.tagline ? `${s.siteName} — ${s.tagline}.` : undefined} />

      <section className="container-x grid items-center gap-12 pb-16 lg:grid-cols-2">
        <img src="/images/can-warehouse.webp" alt="MAI WADI 5-gallon water bottle" width={1376} height={768} decoding="async" className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-xl" />
        <div>
          <h2 className="section-title">Who we are</h2>
          <p className="mt-5 text-lg leading-relaxed whitespace-pre-line text-muted">{s.aboutIntro}</p>
          {s.aboutMission && (
            <div className="mt-8 rounded-3xl border-l-4 border-ocean bg-mist p-6">
              <h3 className="text-sm font-bold tracking-wider text-deep uppercase">Our mission</h3>
              <p className="mt-2 leading-relaxed text-ink/80 whitespace-pre-line">{s.aboutMission}</p>
            </div>
          )}
        </div>
      </section>


      <section className="container-x grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2">
        <div className="lg:order-2">
          <img src="/images/facility.webp" alt="MAI WADI purification and bottling line" loading="lazy" decoding="async" width={1024} height={1024} className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-xl" />
        </div>
        <div className="lg:order-1">
          <span className="eyebrow"><Factory className="size-3.5" /> Our facility</span>
          <h2 className="section-title mt-3">Purified right here in Fujairah</h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Every bottle is processed using state-of-the-art purification technology and a rigorous quality control process, so every drop meets UAE.S/GSO standards.
          </p>
          <ul className="mt-6 space-y-3">
            {['Advanced purification technology', 'Low sodium, engineered for everyday wellness', 'Reusable 5-gallon bottles that reduce single-use plastic'].map((t) => (
              <li key={t} className="flex items-start gap-3 text-ink/80"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-aqua" /> {t}</li>
            ))}
          </ul>
        </div>
      </section>

      {s.aboutValues.length > 0 && (
        <section className="bg-mist py-16 sm:py-20">
          <div className="container-x">
            <h2 className="section-title text-center">Our values</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {s.aboutValues.map((v, i) => {
                const Icon = ICONS[i % ICONS.length];
                return (
                  <div key={i} className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
                    <Icon className="size-8 text-ocean" />
                    <h3 className="mt-4 text-xl font-semibold">{v.title}</h3>
                    <p className="mt-2 text-muted">{v.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="container-x grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1fr_1fr]">
        <div>
          <span className="eyebrow"><Truck className="size-3.5" /> Delivery & service</span>
          <h2 className="section-title mt-3">Delivered to your door</h2>
          <p className="mt-5 text-lg leading-relaxed whitespace-pre-line text-muted">{s.aboutDelivery}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products" className="btn-primary">Order now</Link>
            <Link to="/contact" className="btn-outline">Contact us</Link>
          </div>
        </div>
        <div className="relative pb-10 sm:pb-0">
          <img src="/images/truck-full.jpg" alt="MAI WADI delivery truck" loading="lazy" decoding="async" className="aspect-[4/3] w-full rounded-[2rem] object-cover object-[50%_58%] shadow-xl" />
          <img src="/images/delivery.webp" alt="MAI WADI delivery team member carrying a water bottle" loading="lazy" decoding="async" width={1376} height={768}
            className="absolute -bottom-2 -left-2 aspect-[4/3] w-1/2 rounded-3xl border-4 border-white object-cover object-[35%_50%] shadow-2xl sm:-bottom-8 sm:-left-8" />
        </div>
      </section>
    </>
  );
}
