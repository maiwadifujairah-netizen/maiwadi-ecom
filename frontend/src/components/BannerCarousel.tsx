import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '../types';
import CtaLink from './CtaLink';
import { Img } from './States';

function BannerButton({ b }: { b: Banner }) {
  if (!b.buttonText || !b.buttonLink) return null;
  return <CtaLink to={b.buttonLink} className="btn-white mt-6">{b.buttonText} <ArrowRight className="size-4" /></CtaLink>;
}

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const n = banners.length;

  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n]);

  if (!n) return null;
  const go = (d: number) => setI((x) => (x + d + n) % n);

  return (
    <section className="container-x py-12 sm:py-16" aria-roledescription="carousel" aria-label="Promotions">
      <div className="relative overflow-hidden rounded-[2rem] bg-deep shadow-xl shadow-deep/10">
        {banners.map((b, idx) => (
          <div key={b._id} className={`transition-opacity duration-700 ${idx === i ? 'relative opacity-100' : 'pointer-events-none absolute inset-0 opacity-0'}`} aria-hidden={idx !== i}>
            <Img src={b.image} alt="" className="absolute inset-0 size-full object-cover" eager={idx === 0} />
            <div className="absolute inset-0 bg-gradient-to-r from-deep/90 via-deep/60 to-transparent" />
            <div className="relative flex min-h-[280px] max-w-xl flex-col justify-center p-8 text-white sm:min-h-[340px] sm:p-14">
              <h2 className="text-3xl font-bold sm:text-4xl">{b.title}</h2>
              {b.subtitle && <p className="mt-3 text-base text-white/85 sm:text-lg">{b.subtitle}</p>}
              <div><BannerButton b={b} /></div>
            </div>
          </div>
        ))}
        {n > 1 && (
          <>
            <div className="absolute right-6 bottom-6 flex gap-2">
              <button onClick={() => go(-1)} className="grid size-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30" aria-label="Previous banner"><ChevronLeft className="size-5" /></button>
              <button onClick={() => go(1)} className="grid size-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30" aria-label="Next banner"><ChevronRight className="size-5" /></button>
            </div>
            <div className="absolute bottom-8 left-8 flex gap-2 sm:left-14">
              {banners.map((b, idx) => (
                <button key={b._id} onClick={() => setI(idx)} className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-8 bg-white' : 'w-3 bg-white/50'}`} aria-label={`Show banner ${idx + 1}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
