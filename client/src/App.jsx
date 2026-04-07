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
    try { await api.resendVerification(); setSent(true) } catch (_) {}
    setLoading(false)
  }

  return (
    <div style={{
      background: '#FFFBEB',
      borderBottom: '1px solid #FDE68A',
      padding: '9px 28px',
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: '0.81rem', color: '#92400E', flexWrap: 'wrap',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>
        Verify your email — we sent a link to{' '}
        <strong style={{ color: '#78350F' }}>{email}</strong>
      </span>
      {sent ? (
        <span style={{ color: '#15803D', fontWeight: 600 }}>Sent!</span>
      ) : (
        <button
          onClick={handleResend}
          disabled={loading}
          style={{ background: 'none', border: 'none', color: '#B45309', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.81rem', fontFamily: 'inherit', padding: 0, opacity: loading ? 0.5 : 1, textDecoration: 'underline' }}
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
          position: 'fixed', bottom: 72, right: 24, zIndex: 90,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 18px', width: 232,
          boxShadow: '0 8px 32px rgba(26,20,10,0.14)',
          animation: 'fadeUp 0.22s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 5, fontFamily: 'var(--font-display)' }}>
            Need help?
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 12px' }}>
            Email us and we'll get back to you quickly.
          </p>
          <a href="mailto:support@marginpilot.co" className="btn btn-primary btn-sm" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            support@marginpilot.co
          </a>
          <div style={{ position: 'absolute', bottom: -6, right: 19, width: 11, height: 11, background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)' }} />
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Help"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 90,
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--accent)', border: 'none',
          boxShadow: '0 3px 10px rgba(26,92,56,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 5px 16px rgba(26,92,56,0.4)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(26,92,56,0.3)' }}
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
      background: 'rgba(243, 240, 232, 0.85)',
      backdropFilter: 'blur(10px)',
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
        boxShadow: '0 24px 60px rgba(26,20,10,0.14)',
        animation: 'fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(26,92,56,0.3)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M7 22l5-9 5 6 3-4 3 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'var(--font-display)' }}>Margin Pilot</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.09em', marginTop: 2, textTransform: 'uppercase' }}>Profitability Engine</div>
          </div>
        </div>

        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.025em', fontFamily: 'var(--font-display)' }}>
          Unlock full access
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 0, lineHeight: 1.65 }}>
          AI-powered pricing insights, margin analytics, inventory intelligence, and the deal simulator.
        </p>

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3, margin: '22px 0', padding: '18px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.04em' }}>$79</span>
          <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>/month</span>
        </div>

        {/* Features */}
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', textAlign: 'left' }}>
          {['Price recommendations & margin analytics', 'AI pricing & inventory insights', 'Deal simulator', 'Unlimited products'].map(f => (
            <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="7" cy="7" r="7" fill="var(--accent)" fillOpacity="0.1"/>
                <path d="M4 7l2 2 4-4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {f}
            </li>
          ))}
        </ul>

        {error && (
          <div style={{ marginBottom: 14, padding: '9px 13px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 8, fontSize: '0.79rem', color: 'var(--red)', textAlign: 'left' }}>
            {error}
          </div>
        )}

        <button className="btn btn-primary" onClick={handleSubscribe} disabled={loading} style={{ width: '100%', padding: '11px', fontSize: '0.9rem', opacity: loading ? 0.65 : 1 }}>
          {loading ? 'Redirecting…' : 'Subscribe — $79/mo'}
        </button>

        <p style={{ marginTop: 10, fontSize: '0.71rem', color: 'var(--text-muted)' }}>
          Secure payments via Stripe · Cancel anytime
        </p>

        <button
          onClick={onLogout}
          style={{ marginTop: 14, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [auth, setAuth] = useState(() => {
    try {
      const cached = localStorage.getItem('mp_auth')
      return cached ? JSON.parse(cached) : null
    } catch { return null }
  })
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
          try { localStorage.setItem('mp_auth', JSON.stringify(data)) } catch {}
          if (shop) window.history.replaceState({}, '', '/')
          if (!data.needsStore) fetchStores()
        } else {
          setAuth(false)
          try { localStorage.removeItem('mp_auth') } catch {}
        }
      })
      .catch(() => {
        // Keep cached auth on network error so app doesn't flash to login
      })
  }, [])

  const handleLogout = async () => {
    await api.logout()
    try { localStorage.removeItem('mp_auth') } catch {}
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
          api.me().then((data) => { if (data?.authenticated) { setAuth(data); try { localStorage.setItem('mp_auth', JSON.stringify(data)) } catch {}; fetchStores() } })
        }}
      />
    )
  }

  // 🔄 LOADING (only on first-ever visit with no cached session)
  if (auth === null) {
    return <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} />
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
          onLogin={(user) => { setAuth(user); try { localStorage.setItem('mp_auth', JSON.stringify(user)) } catch {}; fetchStores() }}
        />
      )
    }

    return (
      <OnboardingFlow
        initialStep={onboardingStep}
        onSwitch={() => setAuthMode('login')}
        onComplete={() => {
          api.me().then((data) => {
            if (data?.authenticated) {
              setAuth(data)
              try { localStorage.setItem('mp_auth', JSON.stringify(data)) } catch {}
              if (!data.needsStore) fetchStores()
            } else {
              setAuth(false)
              try { localStorage.removeItem('mp_auth') } catch {}
            }
          }).catch(() => {})
        }}
      />
    )
  }

  // auth.needsStore — fall through to the main shell; sidebar has "Connect new store"

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
        {!auth.shop && (
          <div style={{
            background: '#F0FDF4', borderBottom: '1px solid #BBF7D0',
            padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 10,
            fontSize: '0.81rem', color: '#166534', flexWrap: 'wrap',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1" fill="#16a34a" stroke="none"/>
            </svg>
            <span>No Shopify store connected yet —</span>
            <button
              style={{ background: 'none', border: 'none', color: '#15803D', cursor: 'pointer', fontWeight: 700, fontSize: '0.81rem', fontFamily: 'inherit', padding: 0, textDecoration: 'underline' }}
              onClick={() => {
                const shop = window.prompt('Enter your store name (just the part before .myshopify.com):')
                if (shop) window.location.href = `/auth?shop=${encodeURIComponent(shop.trim().replace(/\.myshopify\.com$/, '') + '.myshopify.com')}`
              }}
            >
              Connect Shopify store
            </button>
          </div>
        )}
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
          fontSize: '0.69rem', color: 'var(--text-muted)',
          padding: '14px 28px', borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center', marginTop: 'auto', lineHeight: 1.6,
        }}>
          Margin Pilot provides pricing suggestions based on your data. Always review before applying changes. Not a guarantee of specific financial outcomes.
        </footer>
      </main>

      {!isPaid && <PaywallOverlay onLogout={handleLogout} />}
      <HelpButton />
    </div>
  )
}
