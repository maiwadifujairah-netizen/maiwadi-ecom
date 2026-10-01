import { Link } from 'react-router-dom';
import { ArrowRight, Droplets, Leaf, Phone, ShieldCheck, Smartphone, Truck } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useMeta } from '../hooks/useMeta';
import { useSite } from '../context/SiteContext';
import BannerCarousel from '../components/BannerCarousel';
import HeroBanner from '../components/HeroBanner';
import CustomerLogos from '../components/CustomerLogos';
import ProductCard from '../components/ProductCard';
import ProductShowcase from '../components/ProductShowcase';
import { WhatsAppIcon } from '../components/icons';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { telHref, waHref } from '../utils/format';
import type { Banner, Paged, Product } from '../types';

const FEATURE_ICONS = [Droplets, Leaf, Truck, Smartphone, ShieldCheck];

function FeaturedProducts() {
  const { data, loading, error, reload } = useFetch<Paged<Product>>('/products?featured=true&limit=8');
  return (
    <section className="container-x py-16 sm:py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Our product</span>
          <h2 className="section-title mt-3">Fresh water, ready to order</h2>
        </div>
        {(data?.items.length ?? 0) > 1 && <Link to="/products" className="btn-ghost">View all products <ArrowRight className="size-4" /></Link>}
      </div>
      {loading ? <Loading label="Loading products…" />
        : error ? <ErrorState message={error} onRetry={reload} />
        : !data?.items.length ? <EmptyState title="Products coming soon" text="Our online catalogue is being prepared. Contact us to order in the meantime." />
        : data.items.length === 1 ? <ProductShowcase product={data.items[0]} />
        : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{data.items.map((p) => <ProductCard key={p._id} product={p} />)}</div>}
    </section>
  );
}

function WhyChoose() {
  const { settings } = useSite();
  if (!settings.features.length) return null;
  return (
    <section className="bg-mist py-16 sm:py-24">
      <div className="container-x grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <img src="/images/facility.webp" alt="Water purification and bottling line" loading="lazy" decoding="async" width={1024} height={1024} className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-xl sm:aspect-square lg:aspect-[4/5]" />
          <figure className="absolute -right-2 -bottom-6 w-2/5 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-2xl sm:-right-6">
            <img src="/images/cans-duo.webp" alt="MAI WADI reusable water bottles" loading="lazy" decoding="async" width={1024} height={1024} className="aspect-square w-full object-cover" />
          </figure>
        </div>
        <div>
          <span className="eyebrow">Why MAI WADI</span>
          <h2 className="section-title mt-3">Why choose {settings.siteName}?</h2>
          <p className="mt-4 max-w-xl text-muted">Purified in Fujairah with advanced technology and careful quality control, then delivered to your door.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {settings.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
              return (
                <div key={i} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-ocean/10">
                  <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-ocean to-aqua text-white shadow-lg shadow-ocean/25"><Icon className="size-5" /></div>
                  <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutBrand() {
  const { settings } = useSite();
  return (
    <section className="container-x grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
      <div className="relative">
        <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-aqua/20 to-ocean/5" />
        <img src="/images/delivery.webp" alt="MAI WADI delivery team carrying a water bottle" loading="lazy" decoding="async" width={1376} height={768} className="aspect-[4/3] w-full rounded-[2rem] object-cover object-[35%_50%] shadow-xl" />
      </div>
      <div>
        <span className="eyebrow">About the brand</span>
        <h2 className="section-title mt-3">As pure as you</h2>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          {settings.aboutIntro || 'MAI WADI supplies purified drinking water in water cans to homes and businesses, backed by our own delivery team.'}
        </p>
        <Link to="/about" className="btn-primary mt-8">Learn more about us <ArrowRight className="size-4" /></Link>
      </div>
    </section>
  );
}

function ContactCta() {
  const { settings: s } = useSite();
  return (
    <section className="container-x py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-deep via-ocean to-aqua px-6 py-14 text-white sm:px-14">
        <Droplets className="pointer-events-none absolute -right-10 -bottom-10 size-72 text-white/10" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Need water delivered?</h2>
            <p className="mt-3 max-w-xl text-white/85">For home deliveries, office supply or bulk orders, get in touch — our team will arrange your delivery.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {s.mobile && <a href={telHref(s.mobile)} className="btn-white"><Phone className="size-4" /> Call {s.mobile}</a>}
            {s.whatsapp && <a href={waHref(s.whatsapp, 'Hello MAI WADI, I would like to request a water delivery.')} target="_blank" rel="noopener" className="btn border border-white/40 text-white hover:bg-white/10"><WhatsAppIcon className="size-4" /> WhatsApp</a>}
            <Link to="/contact" className="btn border border-white/40 text-white hover:bg-white/10">Send inquiry</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useMeta('', 'MAI WADI purified drinking water in water cans, delivered to your home or office. Order online, call or WhatsApp.');
  // One request: the first active hero banner (lowest order) drives the hero; the rest feed the promo carousel.
  const { data: banners, loading } = useFetch<Banner[]>('/banners');
  const hero = banners?.find((b) => b.placement === 'hero') ?? null;
  const promos = banners?.filter((b) => b.placement !== 'hero') ?? [];
  return (
    <>
      <HeroBanner key={hero?._id ?? "default"} banner={hero} loading={loading} />
      <BannerCarousel banners={promos} />
      <FeaturedProducts />
      <WhyChoose />
      <AboutBrand />
      <CustomerLogos />
      <ContactCta />
    </>
  );
}
