import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import Logo from './Logo';
import { InstagramIcon, WhatsAppIcon } from './icons';
import { useSite } from '../context/SiteContext';
import { telHref, waHref } from '../utils/format';

export default function Footer() {
  const { settings: s } = useSite();
  const socials = Object.entries(s.socials).filter(([, url]) => url);
  const names: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', x: 'X', tiktok: 'TikTok' };

  return (
    <footer className="border-t border-slate-100 bg-mist">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo className="h-20" />
          <p className="mt-4 max-w-xs text-sm text-muted">Purified drinking water in water cans, delivered to homes and businesses.</p>
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-wider text-deep uppercase">Quick links</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[['/', 'Home'], ['/products', 'Products'], ['/about', 'About Us'], ['/contact', 'Contact'], ['/cart', 'Cart'], ['/account', 'My account']].map(([to, label]) => (
              <li key={to}><Link to={to} className="text-ink/80 hover:text-ocean">{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-wider text-deep uppercase">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-ink/80">
            {s.phone && <li><a href={telHref(s.phone)} className="flex items-center gap-2 hover:text-ocean"><Phone className="size-4 text-ocean" /> {s.phone}</a></li>}
            {s.mobile && <li><a href={telHref(s.mobile)} className="flex items-center gap-2 hover:text-ocean"><Phone className="size-4 text-ocean" /> {s.mobile}</a></li>}
            {s.whatsapp && <li><a href={waHref(s.whatsapp)} target="_blank" rel="noopener" className="flex items-center gap-2 hover:text-ocean"><WhatsAppIcon className="size-4 text-ocean" /> WhatsApp us</a></li>}
            {s.email && <li><a href={`mailto:${s.email}`} className="flex items-center gap-2 hover:text-ocean"><Mail className="size-4 text-ocean" /> {s.email}</a></li>}
            {s.address && <li className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-ocean" /> {s.address}</li>}
            {s.workingHours && <li className="flex items-start gap-2"><Clock className="mt-0.5 size-4 shrink-0 text-ocean" /> {s.workingHours}</li>}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-wider text-deep uppercase">Order water</h3>
          <p className="mt-4 text-sm text-muted">Order online in minutes, or reach our team directly for regular deliveries.</p>
          <Link to="/products" className="btn-primary btn-sm mt-4">Shop now</Link>
          {socials.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {socials.map(([k, url]) => k === 'instagram'
                ? <a key={k} href={url} target="_blank" rel="noopener" aria-label={names[k]} title={names[k]} className="grid size-10 place-items-center rounded-full border border-ocean/20 bg-white text-deep transition hover:border-ocean hover:bg-ocean hover:text-white"><InstagramIcon className="size-5" /></a>
                : <a key={k} href={url} target="_blank" rel="noopener" className="rounded-full border border-ocean/20 bg-white px-3 py-1.5 text-xs font-semibold text-deep hover:border-ocean">{names[k]}</a>)}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-ocean/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} {s.siteName}. All rights reserved.</p>
          <p className="font-semibold tracking-[0.2em] text-deep/70 uppercase">{s.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
