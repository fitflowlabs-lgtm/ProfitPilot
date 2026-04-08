import { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import api from './api.js';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import { LoadingSpinner } from './components/UI.jsx';

import LoginPage from './pages/LoginPage.jsx';
import OnboardingFlow from './pages/OnboardingFlow.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import DealsPage from './pages/DealsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import StoreErrorPage from './pages/StoreErrorPage.jsx';
import PaymentSuccessPage from './pages/PaymentSuccessPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';

/* ─── Auth Context ─── */
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const refresh = async () => {
    try {
      const data = await api.get('/api/me');
      if (data.authenticated) {
        setUser({
          email: data.email || null,
          name: data.name || null,
          plan: data.plan || 'free',
          role: data.role || 'user',
          emailVerified: data.emailVerified ?? true,
        });
        if (data.shop) {
          const storeObj = {
            shopDomain: data.shop,
            name: data.shopName || data.shop,
            lastProductsSyncAt: data.lastProductsSyncAt,
            lastOrdersSyncAt: data.lastOrdersSyncAt,
          };
          setStore(storeObj);
        } else {
          setStore(null);
        }
        // Load all stores for the switcher
        try {
          const sd = await api.get('/api/stores');
          setStores((sd.stores || []).map(s => ({
            shopDomain: s.shopDomain,
            name: s.shopName || s.shopDomain,
            lastProductsSyncAt: s.lastProductsSyncAt,
          })));
        } catch { /* ignore */ }
      } else {
        setUser(null);
        setStore(null);
        setStores([]);
      }
    } catch {
      setUser(null);
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const sync = async () => {
    setSyncing(true);
    try {
      await api.post('/api/sync/all');
      await refresh();
    } catch {
      // handled per-page
    } finally {
      setSyncing(false);
    }
  };

  // server takes { shop: "domain" }
  const switchStore = async (shopDomain) => {
    try {
      await api.post('/api/stores/switch', { shop: shopDomain });
      await refresh();
    } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ user, store, stores, loading, syncing, refresh, sync, switchStore }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ─── Protected Route ─── */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size={28} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/* ─── App Shell ─── */
function AppShell({ children }) {
  const { user, store, stores, syncing, sync, switchStore } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar user={user} stores={stores} activeStore={store} onSwitchStore={switchStore} />
      <div className="app-content">
        <Header user={user} store={store} onSync={sync} syncing={syncing} />
        <div style={{ animation: 'fadeUp 0.2s ease both' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Root Redirect ─── */
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size={28} />
      </div>
    );
  }
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/store-error" element={<StoreErrorPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><AppShell><ProductsPage /></AppShell></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><AppShell><InventoryPage /></AppShell></ProtectedRoute>} />
          <Route path="/deals" element={<ProtectedRoute><AppShell><DealsPage /></AppShell></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AppShell><SettingsPage /></AppShell></ProtectedRoute>} />

          {/* Consolidate old routes */}
          <Route path="/recommendations" element={<Navigate to="/products?tab=recommendations" replace />} />
          <Route path="/ai" element={<Navigate to="/products?tab=products" replace />} />

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
