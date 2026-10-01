import { createContext, useContext, type ReactNode } from 'react';
import { useFetch } from '../hooks/useFetch';
import { formatMoney } from '../utils/format';
import type { Settings } from '../types';

const EMPTY: Settings = {
  siteName: 'MAI WADI', tagline: 'As pure as you', currency: 'AED', deliveryFee: 0,
  phone: '', mobile: '', whatsapp: '', email: '', address: '', workingHours: '',
  socials: { facebook: '', instagram: '', x: '', tiktok: '' },
  heroTitle: '', heroSubtitle: '', features: [], aboutIntro: '', aboutMission: '', aboutValues: [], aboutDelivery: '',
};

interface SiteValue { settings: Settings; loaded: boolean; money: (n: number) => string; reload: () => void }
const SiteContext = createContext<SiteValue | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const { data, loading, reload } = useFetch<Settings>('/settings');
  const settings = { ...EMPTY, ...data };
  return (
    <SiteContext.Provider value={{ settings, loaded: !loading, money: (n) => formatMoney(n, settings.currency), reload }}>
      {children}
    </SiteContext.Provider>
  );
}

export const useSite = () => useContext(SiteContext)!;
