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
import SettingsPage from './pages/SettingsPage'
import SupportPage from './pages/SupportPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import VerifyEmailPage from './pages/VerifyEmailPage'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  products: 'Products & Costs',
  recommendations: 'Pricing & Margins',
  inventory: 'Inventory',
  deals: 'Deal Simulator',
  settings: 'Settings',
  'support-admin': 'Support Admin',
}

function EmailVerificationBanner({ email }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleResend = async () => {
    setLoading(true)
    try {
      await api.resendVerification()
      setSent(true)
    } catch (_) {}
    setLoading(false)
  }

  return (
    <div style={{
      background: 'rgba(37, 99, 235, 0.07)',
      borderBottom: '1px solid rgba(37, 99, 235, 0.15)',
      padding: '9px 28px',
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: '0.81rem', color: 'var(--text-secondary)', flexWrap: 'wrap',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>
        Verify your email — we sent a link to{' '}
        <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{email}</strong>
      </span>
      {sent ? (
        <span style={{ color: 'var(--green)', fontWeight: 600 }}>Sent!</span>
      ) : (
        <button
          onClick={handleResend}
          disabled={loading}
          style={{
            background: 'none', border: 'none', color: 'var(--accent-light)',
            cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600,
            fontSize: '0.81rem', fontFamily: 'inherit', padding: 0,
            opacity: loading ? 0.5 : 1, textDecoration: 'underline',
          }}
        >
          {loading ? 'Sending…' : 'Resend'}
        </button>
      )}
    </div>
  )
}

function HelpButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      {open && (
        <div style={{
          position: 'fixed', bottom: 76, right: 24, zIndex: 90,
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 18px', width: 236,
          boxShadow: '0 12px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
          animation: 'fadeUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 5 }}>
            Need help?
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 12px' }}>
            Email us and we'll get back to you quickly.
          </p>
          <a
            href="mailto:support@marginpilot.co"
            className="btn btn-primary btn-sm"
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
          >
            support@marginpilot.co
          </a>
          <div style={{
            position: 'absolute', bottom: -6, right: 19,
            width: 11, height: 11,
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderTop: 'none', borderLeft: 'none',
            transform: 'rotate(45deg)',
          }} />
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Help"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 90,
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--accent)', border: 'none',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.15)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.15)' }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </button>
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
      background: 'rgba(10, 10, 12, 0.88)',
      backdropFilter: 'blur(12px) saturate(1.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: '36px 32px',
        maxWidth: 400, width: '100%',
        textAlign: 'center',
        /* Liquid glass depth */
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        animation: 'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 26 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M7 22l5-9 5 6 3-4 3 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>Margin Pilot</div>
            <div style={{ fontSize: '0.63rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 2, textTransform: 'uppercase' }}>Profitability Engine</div>
          </div>
        </div>

        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Unlock full access
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24, lineHeight: 1.65 }}>
          AI-powered pricing insights, margin analytics, inventory intelligence, and the deal simulator.
        </p>

        {/* Price */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3,
          marginBottom: 24, padding: '16px 0',
          borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)',
        }}>
          <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.04em' }}>$79</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/month</span>
        </div>

        {/* Features */}
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', textAlign: 'left' }}>
          {[
            'Price recommendations & margin analytics',
            'AI pricing & inventory insights',
            'Deal simulator',
            'Unlimited products',
          ].map((f) => (
            <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="7" cy="7" r="7" fill="var(--accent)" fillOpacity="0.12"/>
                <path d="M4 7l2 2 4-4" stroke="var(--accent-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {f}
            </li>
          ))}
        </ul>

        {error && (
          <div style={{
            marginBottom: 14, padding: '9px 13px',
            background: 'var(--red-bg)', border: '1px solid var(--red-border)',
            borderRadius: 8, fontSize: '0.79rem', color: 'var(--red)',
          }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleSubscribe}
          disabled={loading}
          style={{ width: '100%', padding: '11px', fontSize: '0.9rem', opacity: loading ? 0.65 : 1 }}
        >
          {loading ? 'Redirecting…' : 'Subscribe — $79/mo'}
        </button>

        <p style={{ marginTop: 10, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Secure payments via Stripe · Cancel anytime
        </p>

        <button
          onClick={onLogout}
          style={{
            marginTop: 14, background: 'none', border: 'none',
            color: 'var(--text-muted)', fontSize: '0.78rem',
            cursor: 'pointer', padding: 0, fontFamily: 'inherit',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
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
          if (!data.needsStore) fetchStores()
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

  // 📄 PUBLIC PAGES
  if (window.location.pathname === '/terms') return <TermsPage />
  if (window.location.pathname === '/privacy') return <PrivacyPage />
  if (window.location.pathname === '/verify-email') return <VerifyEmailPage />

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
      <div className="loading-center" style={{ minHeight: '100dvh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 26, height: 26,
            border: '1.5px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Loading
          </span>
        </div>
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

  // Logged in but no store connected yet — show connect step
  if (auth.needsStore) {
    return (
      <OnboardingFlow
        initialStep="connect"
        onSwitch={handleLogout}
        onComplete={() => {
          // After skipping/connecting, re-check session
          api.me().then((data) => {
            if (data?.authenticated) { setAuth(data); if (!data.needsStore) fetchStores() }
            else setAuth(false)
          })
        }}
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
      case 'settings': return <SettingsPage stores={stores} onNavigate={setActivePage} />
      case 'support-admin': return <SupportPage isAdmin={auth.role === 'admin'} />
      default: return <DashboardPage {...props} onNavigate={setActivePage} />
    }
  }

  return (
    <div className="app-shell">
      <div
        className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        shop={auth.shop}
        shopName={auth.shopName}
        isOpen={sidebarOpen}
        stores={stores}
        onSwitchStore={handleSwitchStore}
        onStoreConnected={fetchStores}
        role={auth.role}
      />

      <main className="main-content">
        {auth.emailVerified === false && <EmailVerificationBanner email={auth.email} />}
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

        <footer style={{
          fontSize: '0.7rem', color: 'var(--text-muted)',
          padding: '14px 28px', borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center', marginTop: 'auto', lineHeight: 1.6,
          letterSpacing: '0.01em',
        }}>
          Margin Pilot provides pricing suggestions based on your data. Always review before applying changes to your store. Not a guarantee of specific financial outcomes.
        </footer>
      </main>

      {!isPaid && <PaywallOverlay onLogout={handleLogout} />}
      <HelpButton />
    </div>
  )
}
