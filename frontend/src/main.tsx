import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { SiteProvider } from './context/SiteContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { UIProvider } from './context/UIContext';

// After a deploy, an open tab may request a lazy chunk that no longer exists: reload once to get the new build
window.addEventListener('vite:preloadError', () => {
  try {
    if (sessionStorage.getItem('mw_reloaded')) return;
    sessionStorage.setItem('mw_reloaded', '1');
  } catch { return; } // storage blocked: no guard against a reload loop, so don't reload
  location.reload();
});
window.addEventListener('load', () => setTimeout(() => { try { sessionStorage.removeItem('mw_reloaded'); } catch { /* ignore */ } }, 10000));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <UIProvider>
        <SiteProvider>
          <AuthProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AuthProvider>
        </SiteProvider>
      </UIProvider>
    </BrowserRouter>
  </StrictMode>,
);
