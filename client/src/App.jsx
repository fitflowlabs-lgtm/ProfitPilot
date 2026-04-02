import { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import LoginPage from './pages/LoginPage'
import OnboardingFlow from "./pages/OnboardingFlow"
import StoreErrorPage from './pages/StoreErrorPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import RecommendationsPage from './pages/RecommendationsPage'
import InventoryPage from './pages/InventoryPage'
import DealsPage from './pages/DealsPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  products: 'Products & Costs',
  recommendations: 'Pricing & Margins',
  inventory: 'Inventory',
  deals: 'Deal Simulator',
}

function HelpButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 998,
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--surface-raised)', border: '1px solid var(--border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-muted)',
          transition: 'border-color 0.2s, color 0.2s',
        }}
        title="Help"
      >
        ?
      </button>

      {open && (
        <div style={{
          position: 'fixed', bottom: 76, right: 24, zIndex: 998,
          background: 'var(--surface-raised)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '20px 20px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', width: 260,
        }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Need help?</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 14px' }}>
            Reach out and we'll get back to you as soon as possible.
          </p>
          <a
            href="mailto:fitflowlabs@gmail.com"
            style={{
              display: 'block', textAlign: 'center', padding: '8px 14px',
              background: 'var(--accent)', color: '#fff', borderRadius: 8,
              fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none',
            }}
          >
            fitflowlabs@gmail.com
          </a>
          <button
            onClick={() => setOpen(false)}
            style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      )}
    </>
  )
}

function PaywallOverlay({ onLogout }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubscribe = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await api.createCheckoutSession()
      if (result?.url) window.location.href = result.url
    } catch (e) {
      setError(e.message || 'Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(11, 14, 17, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '36px 32px', maxWidth: 420, width: '100%',
        textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
          <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
            <rect width="30" height="30" rx="7" fill="var(--accent)"/>
            <path d="M7 22l5-9 5 6 3-4 3 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>Margin Pilot</div>
            <div style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', marginTop: '3px' }}>PROFITABILITY ENGINE</div>
          </div>
        </div>

        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          Unlock full access
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24, lineHeight: 1.6 }}>
          Get AI-powered pricing insights, margin analytics, inventory intelligence, and the deal simulator.
        </p>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 24 }}>
          <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>$79</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>/month</span>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', textAlign: 'left' }}>
          {[
            'Price recommendations & margin analytics',
            'AI pricing & inventory insights',
            'Deal simulator',
            'Unlimited products',
          ].map((f) => (
            <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="7" cy="7" r="7" fill="var(--accent)" fillOpacity="0.15"/>
                <path d="M4 7l2 2 4-4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {f}
            </li>
          ))}
        </ul>

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--red)' }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleSubscribe}
          disabled={loading}
          style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Redirecting to checkout…' : 'Subscribe — $79/mo'}
        </button>

        <p style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Secure payments via Stripe · Cancel anytime
        </p>

        <button
          onClick={onLogout}
          style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [auth, setAuth] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [onboardingStep, setOnboardingStep] = useState('account')
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [stores, setStores] = useState([])

  const [storeError, setStoreError] = useState(null)
  const [storeErrorShop, setStoreErrorShop] = useState(null)

  const fetchStores = () => {
    api.stores().then((r) => setStores(r?.stores || [])).catch(() => {})
  }

  useEffect(() => {
    if (window.location.pathname === '/payment/success') {
      setActivePage('payment-success')
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shop = params.get('shop')
    const storeErr = params.get('store_error')

    if (storeErr) {
      setStoreErrorShop(params.get('shop') || null)
      setStoreError(storeErr)
      window.history.replaceState({}, '', '/')
      setAuth(false)
      return
    }

    api.me(shop)
      .then((data) => {
        if (data?.authenticated) {
          setAuth(data)
          if (shop) window.history.replaceState({}, '', '/')
          fetchStores()
        } else {
          setAuth(false)
        }
      })
      .catch(() => setAuth(false))
  }, [])

  const handleLogout = async () => {
    await api.logout()
    setAuth(false)
  }

  const handleSwitchStore = async (shop) => {
    try {
      const data = await api.switchStore(shop)
      setAuth((prev) => ({ ...prev, ...data }))
      setRefreshKey((k) => k + 1)
      setActivePage('dashboard')
    } catch (e) {
      console.error('Switch store failed:', e.message)
    }
  }

  const handleSync = useCallback(async () => {
    if (!auth?.shop || syncing) return
    setSyncing(true)
    try {
      const result = await api.syncAll(auth.shop)
      setAuth((prev) => ({ ...prev, ...result }))
      setRefreshKey((k) => k + 1)
    } catch (e) {
      console.error(e)
    }
    setSyncing(false)
  }, [auth, syncing])

  // 💳 PAYMENT SUCCESS
  if (activePage === 'payment-success') {
    return (
      <PaymentSuccessPage
        onContinue={() => {
          window.history.replaceState({}, '', '/')
          setActivePage('dashboard')
          api.me().then((data) => { if (data?.authenticated) { setAuth(data); fetchStores() } })
        }}
      />
    )
  }

  // 🔄 LOADING
  if (auth === null) {
    return (
      <div className="loading-center" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  // 🔐 AUTH FLOW
  if (auth === false) {
    if (storeError) {
      return (
        <StoreErrorPage
          errorCode={storeError}
          shop={storeErrorShop}
          onConnect={() => { setStoreError(null); setOnboardingStep('connect'); setAuthMode('onboarding') }}
          onLogin={() => { setStoreError(null); setAuthMode('login') }}
        />
      )
    }

    if (authMode === 'login') {
      return (
        <LoginPage
          onSwitch={() => { setOnboardingStep('account'); setAuthMode('onboarding') }}
          onNeedsShopify={() => { setOnboardingStep('connect'); setAuthMode('onboarding') }}
          onLogin={(user) => setAuth(user)}
        />
      )
    }

    return (
      <OnboardingFlow
        initialStep={onboardingStep}
        onSwitch={() => setAuthMode('login')}
        onComplete={(user) => setAuth(user)}
      />
    )
  }

  const isPaid = auth.plan && auth.plan !== 'free'

  const renderPage = () => {
    const props = { shop: auth.shop, refreshKey }
    switch (activePage) {
      case 'dashboard': return <DashboardPage {...props} onNavigate={setActivePage} />
      case 'products': return <ProductsPage {...props} />
      case 'recommendations': return <RecommendationsPage {...props} />
      case 'inventory': return <InventoryPage {...props} />
      case 'deals': return <DealsPage {...props} />
      default: return <DashboardPage {...props} onNavigate={setActivePage} />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        shop={auth.shop}
        shopName={auth.shopName}
        isOpen={sidebarOpen}
        stores={stores}
        onSwitchStore={handleSwitchStore}
        onStoreConnected={fetchStores}
      />

      <main className="main-content">
        <Header
          title={PAGE_TITLES[activePage]}
          syncing={syncing}
          lastSync={auth.lastProductsSyncAt}
          onSync={handleSync}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />

        <div style={{
          filter: isPaid ? 'none' : 'blur(4px)',
          pointerEvents: isPaid ? 'auto' : 'none',
          userSelect: isPaid ? 'auto' : 'none',
        }}>
          {renderPage()}
        </div>
      </main>

      {!isPaid && <PaywallOverlay onLogout={handleLogout} />}
      <HelpButton />
    </div>
  )
}
