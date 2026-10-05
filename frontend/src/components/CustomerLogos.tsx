import { CUSTOMERS } from '../utils/brand';

export default function CustomerLogos() {
  return (
    <section className="border-y border-slate-100 bg-mist/60 py-12 sm:py-16 lg:py-20" aria-labelledby="customers-title">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Our customers</span>
          <h2 id="customers-title" className="section-title mt-3">Trusted by businesses and schools</h2>
          <p className="mt-4 text-muted">Proud to supply purified drinking water to organisations across the UAE.</p>
        </div>
        {/* Infinite right-to-left marquee: CSS transform only. Reduced motion → the single list, wrapped and centred. */}
        <div className="mt-12 overflow-hidden py-2">
          <ul className="flex w-max animate-marquee motion-reduce:w-auto motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-4">
            {[...CUSTOMERS, ...CUSTOMERS].map((c, i) => {
              const copy = i >= CUSTOMERS.length;
              return (
                // Spacing is padding on each item (not flex gap) so both halves are exactly equal and -50% lines up.
                <li key={`${c.name}-${i}`} aria-hidden={copy || undefined} className={`w-40 shrink-0 pr-4 sm:w-48 sm:pr-5 lg:w-56 ${copy ? 'motion-reduce:hidden' : ''}`}>
                  <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-ocean/25 hover:shadow-md hover:shadow-ocean/10 sm:p-6">
                    <img src={c.logo} alt={copy ? '' : c.name} title={c.name} width={c.width} height={c.height} decoding="async" className="h-auto max-h-full w-auto max-w-full object-contain" />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
