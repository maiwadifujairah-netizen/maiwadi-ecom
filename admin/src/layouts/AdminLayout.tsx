import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ExternalLink, Image, LayoutDashboard, LogOut, Mail, Menu, Package, Settings, ShoppingBag, Tags, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { SITE_URL } from '../services/api';
import { Loading } from '../components/States';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/banners', label: 'Banners', icon: Image },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/inquiries', label: 'Inquiries', icon: Mail },
  { to: '/settings', label: 'Site settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => { document.title = 'Admin | MAI WADI'; }, [pathname]);

  if (loading) return <Loading />;
  if (user?.role !== 'admin') return <Navigate to="/login" replace />;

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-3 px-6 py-5">
        <Logo className="h-12" />
        <span className="text-xs font-bold tracking-widest text-muted uppercase">Admin</span>
      </Link>
      <nav className="flex-1 space-y-1 px-3" aria-label="Admin">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-ocean text-white shadow-md shadow-ocean/20' : 'text-ink/70 hover:bg-mist hover:text-deep'}`}>
            <Icon className="size-4.5" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-slate-100 p-3">
        <a href={SITE_URL} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/70 hover:bg-mist"><ExternalLink className="size-4.5" /> View website</a>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut className="size-4.5" /> Sign out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-100 bg-white lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button className="absolute top-5 right-4 p-1" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur sm:px-8">
          <button className="rounded-lg p-2 hover:bg-mist lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right text-sm leading-tight">
              <p className="font-semibold">{user.name}</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
            <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-ocean to-aqua font-bold text-white">{user.name[0]}</div>
          </div>
        </header>
        <main className="p-4 sm:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
