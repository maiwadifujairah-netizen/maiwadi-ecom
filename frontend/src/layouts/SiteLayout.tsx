import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { WhatsAppIcon } from '../components/icons';
import { useSite } from '../context/SiteContext';
import { WA_ENQUIRY, waHref } from '../utils/format';

export default function SiteLayout() {
  const { pathname } = useLocation();
  const { settings } = useSite();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded focus:bg-white focus:p-2">Skip to content</a>
      <Navbar />
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
      {settings.whatsapp && (
        <a href={waHref(settings.whatsapp, WA_ENQUIRY)} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
          className="fixed right-5 bottom-5 z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-105">
          <WhatsAppIcon className="size-7" />
        </a>
      )}
    </div>
  );
}
