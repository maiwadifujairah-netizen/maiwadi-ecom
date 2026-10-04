import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useMeta } from '../hooks/useMeta';
import { useSite } from '../context/SiteContext';
import BannerCarousel from '../components/BannerCarousel';
import HeroBanner from '../components/HeroBanner';
import CustomerLogos from '../components/CustomerLogos';
import ProductCard from '../components/ProductCard';
import ProductShowcase from '../components/ProductShowcase';
import { DeliverySection, FeatureCards, TrustStrip } from '../components/BrandSections';
import { EmptyState, ErrorState, Loading } from '../components/States';
import type { Banner, Paged, Product } from '../types';

function WhyChoose() {
  const { settings } = useSite();
  return (
    <section className="container-x section-y grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div className="lg:pt-2">
        <span className="eyebrow">Why choose {settings.siteName}</span>
        <h2 className="section-title mt-3">As pure as you</h2>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          {settings.aboutIntro || 'MAI WADI is a drinking water brand built on a simple promise: water as pure as you. We supply purified drinking water in water cans to homes and businesses, backed by our own delivery team.'}
        </p>
        <Link to="/about" className="btn-outline mt-8">Learn more about us <ArrowRight className="size-4" /></Link>
      </div>
      <FeatureCards className="sm:grid-cols-2" />
    </section>
  );
}

function FeaturedProducts() {
  const { data, loading, error, reload } = useFetch<Paged<Product>>('/products?featured=true&limit=8');
  const items = data?.items ?? [];
  return (
    <section className="bg-mist">
      <div className="container-x section-y">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <span className="eyebrow">Our products</span>
            <h2 className="section-title mt-3">High-quality water cans <br className="hidden sm:block" />for home and office</h2>
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
  const { data: banners, loading } = useFetch<Banner[]>('/banners');
  const hero = banners?.find((b) => b.placement === 'hero') ?? null;
  const promos = banners?.filter((b) => b.placement !== 'hero') ?? [];
  return (
    <>
      <HeroBanner key={hero?._id ?? 'default'} banner={hero} loading={loading} />
      <TrustStrip />
      <WhyChoose />
      <FeaturedProducts />
      <BannerCarousel banners={promos} />
      <CustomerLogos />
      <DeliverySection />
    </>
  );
}
