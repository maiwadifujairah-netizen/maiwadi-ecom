import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { SiteProvider } from './context/SiteContext';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <UIProvider>
        <SiteProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SiteProvider>
      </UIProvider>
    </BrowserRouter>
  </StrictMode>,
);
