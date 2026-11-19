import { useEffect, useRef, useState } from 'react';

/** Official Google Identity Services button (popup flow, ID token only: openid email profile). Hidden when no client ID is set. */
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const googleEnabled = Boolean(CLIENT_ID);

type Gis = {
  initialize(o: { client_id: string; callback: (r: { credential: string }) => void; ux_mode: 'popup'; context: string }): void;
  renderButton(el: HTMLElement, o: Record<string, string | number>): void;
};
declare global { interface Window { google?: { accounts: { id: Gis } } } }

let script: Promise<void> | undefined;
const loadGis = () => (script ??= new Promise<void>((ok, fail) => {
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.onload = () => ok();
  s.onerror = () => { script = undefined; fail(new Error('gsi load failed')); };
  document.head.appendChild(s);
}));

// Closing the Google popup fires no callback, so a cancelled sign-in simply leaves the page as it was.
export default function GoogleButton({ text, onCredential }: { text: 'continue_with' | 'signup_with'; onCredential: (credential: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onCredential);
  const [failed, setFailed] = useState(false);
  useEffect(() => { cb.current = onCredential; });

  useEffect(() => {
    if (!CLIENT_ID) return;
    let live = true;
    loadGis().then(() => {
      const el = ref.current, id = window.google?.accounts.id;
      if (!live || !el || !id) return;
      id.initialize({ client_id: CLIENT_ID, callback: (r) => cb.current(r.credential), ux_mode: 'popup', context: text === 'signup_with' ? 'signup' : 'signin' });
      id.renderButton(el, { type: 'standard', theme: 'outline', size: 'large', shape: 'pill', text, logo_alignment: 'center', width: Math.min(400, el.offsetWidth || 320) });
    }, () => live && setFailed(true));
    return () => { live = false; };
  }, [text]);

  if (!CLIENT_ID) return null;
  if (failed) return <p className="text-center text-sm text-muted">Google sign-in couldn't load. Check your connection or use your email and password.</p>;
  return <div ref={ref} className="flex min-h-11 w-full justify-center" />;
}
