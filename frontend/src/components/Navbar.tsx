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
    `relative py-2 text-sm font-semibold transition ${isActive ? 'text-ocean' : 'text-ink/80 hover:text-ocean'}`;

  return (
    <header className={`sticky top-0 z-50 bg-white/90 backdrop-blur-lg transition-shadow ${scrolled ? 'shadow-[0_1px_0_0_rgb(0_0_0/0.06)]' : ''}`}>
      <div className="container-x flex h-20 items-center justify-between gap-4">
        <Link to="/" aria-label="MAI WADI home" className="shrink-0"><Logo className="h-14" /></Link>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Main">
          {LINKS.map((l) => <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkCls}>{l.label}</NavLink>)}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {settings.mobile && (
            <a href={telHref(settings.mobile)} className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-deep hover:bg-mist lg:inline-flex">
              <Phone className="size-4" /> {settings.mobile}
            </a>
          )}
          <Link to={user ? '/account' : '/login'} className="rounded-full p-2.5 text-ink hover:bg-mist" aria-label="Account">
            <User className="size-5" />
          </Link>
          <Link to="/cart" className="relative rounded-full p-2.5 text-ink hover:bg-mist" aria-label={`Cart, ${count} items`}>
            <ShoppingCart className="size-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-aqua px-1 text-[11px] leading-5 font-bold text-white">{count}</span>
            )}
          </Link>
          <button className="rounded-full p-2.5 text-ink hover:bg-mist md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-slate-100 bg-white md:hidden" aria-label="Mobile">
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
