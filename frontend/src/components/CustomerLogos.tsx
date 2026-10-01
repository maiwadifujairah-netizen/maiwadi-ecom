import { CUSTOMERS } from '../utils/brand';

export default function CustomerLogos() {
  return (
    <section className="border-y border-slate-100 bg-mist/60 py-16 sm:py-20" aria-labelledby="customers-title">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Our customers</span>
          <h2 id="customers-title" className="section-title mt-3">Trusted by businesses and schools</h2>
          <p className="mt-4 text-muted">Proud to supply purified drinking water to organisations across the UAE.</p>
        </div>
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {CUSTOMERS.map((c) => (
            <li key={c.name} className="group flex aspect-[4/3] items-center justify-center rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-ocean/25 hover:shadow-md hover:shadow-ocean/10 sm:p-6">
              <img src={c.logo} alt={c.name} title={c.name} width={c.width} height={c.height} loading="lazy" decoding="async" className="h-auto max-h-full w-auto max-w-full object-contain" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
