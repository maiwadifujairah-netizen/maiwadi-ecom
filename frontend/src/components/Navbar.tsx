import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Phone, ShoppingCart, User, X } from 'lucide-react';
import Logo from './Logo';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { telHref } from '../utils/format';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Products' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { count } = useCart();
  const { user } = useAuth();
  const { settings } = useSite();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `relative py-7 text-[15px] font-semibold transition after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-ocean after:transition after:duration-200 ${isActive ? 'text-ocean after:scale-x-100' : 'text-ink hover:text-ocean after:scale-x-0'}`;

  return (
    <header className={`sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-lg transition-shadow ${scrolled ? 'shadow-[0_8px_24px_-16px_rgb(11_30_71/0.25)]' : ''}`}>
      <div className="container-x flex h-[72px] items-center justify-between gap-4 lg:h-20">
        <Link to="/" aria-label="MAI WADI home" className="shrink-0"><Logo className="h-12 lg:h-14" /></Link>

        <nav className="hidden items-center gap-8 md:flex lg:gap-12" aria-label="Main">
          {LINKS.map((l) => <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkCls}>{l.label}</NavLink>)}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {settings.mobile && (
            <a href={telHref(settings.mobile)} className="mr-2 hidden items-center gap-2.5 border-r border-slate-200 py-1 pr-5 text-[15px] font-bold text-ink hover:text-ocean lg:inline-flex">
              <Phone className="size-[18px] text-ocean" /> {settings.mobile}
            </a>
          )}
          <Link to={user ? '/account' : '/login'} className="rounded-full p-2.5 text-ink hover:bg-mist" aria-label="Account">
            <User className="size-5" />
          </Link>
          <Link to="/cart" className="relative rounded-full p-2.5 text-ink hover:bg-mist" aria-label={`Cart, ${count} items`}>
            <ShoppingCart className="size-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-ocean px-1 text-[11px] leading-5 font-bold text-white ring-2 ring-white">{count}</span>
            )}
          </Link>
          <button className="rounded-full p-2.5 text-ink hover:bg-mist md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-slate-100 bg-white shadow-lg md:hidden" aria-label="Mobile">
          <div className="container-x flex flex-col py-3">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `rounded-xl px-3 py-3 font-semibold ${isActive ? 'bg-mist text-ocean' : 'text-ink'}`}>
                {l.label}
              </NavLink>
            ))}
            {settings.mobile && (
              <a href={telHref(settings.mobile)} className="mt-2 btn-primary"><Phone className="size-4" /> Call {settings.mobile}</a>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
