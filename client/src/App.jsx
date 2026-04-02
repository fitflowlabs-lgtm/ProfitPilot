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
import PricingPage from './pages/PricingPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  products: 'Products & Costs',
  recommendations: 'Pricing & Margins',
  inventory: 'Inventory',
  deals: 'Deal Simulator',
  pricing: 'Plans & Billing',
}

export default function App() {
  const [auth, setAuth] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [onboardingStep, setOnboardingStep] = useState('account')
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [storeError, setStoreError] = useState(null)
  const [storeErrorShop, setStoreErrorShop] = useState(null)

  useEffect(() => {
    if (window.location.pathname === '/payment/success') {
      setActivePage('payment-success')
    } else if (window.location.pathname === '/pricing') {
      setActivePage('pricing')
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

  // 💳 PAYMENT SUCCESS (no auth shell needed)
  if (activePage === 'payment-success') {
    return <PaymentSuccessPage onContinue={() => { window.history.replaceState({}, '', '/'); setActivePage('dashboard') }} />
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

  // 🧭 APP ROUTING (unchanged)
  const renderPage = () => {
    const props = { shop: auth.shop, refreshKey }

    switch (activePage) {
      case 'dashboard': return <DashboardPage {...props} onNavigate={setActivePage} />
      case 'products': return <ProductsPage {...props} />
      case 'recommendations': return <RecommendationsPage {...props} />
      case 'inventory': return <InventoryPage {...props} />
      case 'deals': return <DealsPage {...props} />
      case 'pricing': return <PricingPage currentPlan={auth.plan || 'free'} />
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
        plan={auth.plan}
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

        {renderPage()}
      </main>
    </div>
  )
}