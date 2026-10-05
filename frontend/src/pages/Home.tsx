import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useMeta } from '../hooks/useMeta';
import { useSite } from '../context/SiteContext';
import BannerCarousel from '../components/BannerCarousel';
import HeroBanner from '../components/HeroBanner';
import CustomerLogos from '../components/CustomerLogos';
import ProductCard from '../components/ProductCard';
import ProductShowcase from '../components/ProductShowcase';
import { DeliverySection, FEATURED_URL, FactoryImage, FeatureStrip } from '../components/BrandSections';
import { HIGHLIGHTS } from '../utils/brand';
import { EmptyState, ErrorState, Loading } from '../components/States';
import type { Banner, Paged, Product } from '../types';

function WhyChoose() {
  const { settings } = useSite();
  return (
    <section className="container-x section-y grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <span className="eyebrow rounded-full bg-mist px-3 py-1.5">Why choose us</span>
        <h2 className="section-title mt-4">Why choose {settings.siteName}?</h2>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          {settings.aboutIntro || 'MAI WADI is a drinking water brand built on a simple promise: water as pure as you. We supply purified drinking water in water cans to homes and businesses, backed by our own delivery team.'}
        </p>
        <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
          {HIGHLIGHTS.map((h) => (
            <li key={h} className="flex items-center gap-2.5 text-[15px] font-medium text-ink/80"><CheckCircle2 className="size-5 shrink-0 fill-ocean/15 text-ocean" /> {h}</li>
          ))}
        </ul>
        <Link to="/about" className="btn-primary mt-8 px-7">Learn more about us <ArrowRight className="size-4" /></Link>
      </div>
      <FactoryImage className="aspect-[5/4] rounded-3xl shadow-[0_24px_60px_-30px_rgb(11_30_71/0.45)]" />
    </section>
  );
}

function FeaturedProducts({ data, loading, error, reload }: { data: Paged<Product> | null; loading: boolean; error: string | null; reload: () => void }) {
  const items = data?.items ?? [];
  return (
    <section className="bg-[linear-gradient(180deg,#eef6fd_0%,#f7fbff_100%)]">
      <div className="container-x section-y">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <span className="eyebrow rounded-full bg-white px-3 py-1.5">Our products</span>
            <h2 className="section-title mt-4">High-quality water cans <br className="hidden sm:block" />for home and office</h2>
            <p className="mt-4 text-muted">Choose from our range of purified drinking water cans, ready for fast and reliable delivery.</p>
          </div>
          <Link to="/products" className="btn-outline">View all products <ArrowRight className="size-4" /></Link>
        </div>
        {loading ? <Loading label="Loading products…" />
          : error ? <ErrorState message={error} onRetry={reload} />
          : !items.length ? <EmptyState title="Products coming soon" text="Our online catalogue is being prepared. Contact us to order in the meantime." />
          : items.length === 1 ? <ProductShowcase product={items[0]} />
          : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((p) => <ProductCard key={p._id} product={p} />)}</div>}
      </div>
    </section>
  );
}

export default function Home() {
  useMeta('', 'MAI WADI purified drinking water in water cans, delivered to your home or office. Order online, call or WhatsApp.');
  // One request: the first active hero banner (lowest order) drives the hero; the rest feed the promo carousel.
  const { data: banners } = useFetch<Banner[]>('/banners', true);
  const hero = banners?.find((b) => b.placement === 'hero') ?? null;
  const promos = banners?.filter((b) => b.placement !== 'hero') ?? [];
  // One product request feeds both the product section and the "Why choose" image (same Admin product image).
  const featured = useFetch<Paged<Product>>(FEATURED_URL, true);
  return (
    <>
      <HeroBanner key={hero ? `${hero._id}:${hero.image}:${hero.mobileImage}` : 'default'} banner={hero} />
      <FeatureStrip />
      <WhyChoose />
      <FeaturedProducts {...featured} />
      <BannerCarousel banners={promos} />
      <CustomerLogos />
      <DeliverySection />
    </>
  );
}
