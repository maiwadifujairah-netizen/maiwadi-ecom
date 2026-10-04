import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import Logo from './Logo';
import { InstagramIcon, WhatsAppIcon } from './icons';
import { useSite } from '../context/SiteContext';
import { telHref, waHref } from '../utils/format';

const LINKS = [['/', 'Home'], ['/products', 'Products'], ['/about', 'About Us'], ['/contact', 'Contact']];
const NAMES: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', x: 'X', tiktok: 'TikTok' };
const heading = 'font-display text-base font-bold text-white';
const social = 'grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-ocean';

export default function Footer() {
  const { settings: s } = useSite();
  const socials = Object.entries(s.socials).filter(([, url]) => url);

  return (
    <footer className="bg-navy text-white/70">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1fr_1.1fr] lg:py-16">
        <div>
          <span className="inline-block rounded-2xl bg-white p-2.5"><Logo className="h-16" /></span>
          <p className="mt-5 max-w-xs text-sm leading-relaxed">Purified drinking water, delivered to your door in Fujairah.</p>
          <p className="mt-3 text-xs font-semibold tracking-[0.25em] text-aqua uppercase">{s.tagline}</p>
        </div>
        <div>
          <h3 className={heading}>Quick links</h3>
          <ul className="mt-5 space-y-3 text-sm">
            {LINKS.map(([to, label]) => <li key={to}><Link to={to} className="hover:text-white">{label}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className={heading}>Contact</h3>
          <ul className="mt-5 space-y-3.5 text-sm">
            {s.phone && <li><a href={telHref(s.phone)} className="flex items-center gap-3 hover:text-white"><Phone className="size-4 text-aqua" /> {s.phone}</a></li>}
            {s.mobile && <li><a href={telHref(s.mobile)} className="flex items-center gap-3 hover:text-white"><Phone className="size-4 text-aqua" /> {s.mobile}</a></li>}
            {s.email && <li><a href={`mailto:${s.email}`} className="flex items-center gap-3 hover:text-white"><Mail className="size-4 text-aqua" /> {s.email}</a></li>}
            <li className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-aqua" /> {s.address || 'Fujairah, UAE'}</li>
            {s.workingHours && <li className="flex items-start gap-3"><Clock className="mt-0.5 size-4 shrink-0 text-aqua" /> {s.workingHours}</li>}
          </ul>
        </div>
        <div>
          <h3 className={heading}>Order water</h3>
          <p className="mt-5 text-sm leading-relaxed">Order online in minutes, or reach our team directly for regular deliveries.</p>
          <Link to="/products" className="btn-primary btn-sm mt-5">Shop now</Link>
          <div className="mt-6 flex flex-wrap gap-2">
            {socials.map(([k, url]) => k === 'instagram'
              ? <a key={k} href={url} target="_blank" rel="noopener noreferrer" aria-label={NAMES[k]} title={NAMES[k]} className={social}><InstagramIcon className="size-5" /></a>
              : <a key={k} href={url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-ocean">{NAMES[k]}</a>)}
            {s.whatsapp && <a href={waHref(s.whatsapp)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp" className={social}><WhatsAppIcon className="size-5" /></a>}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} {s.siteName}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
