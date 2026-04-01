import { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import LoginPage from './pages/LoginPage'
import OnboardingPage from "./pages/OnboardingPage"
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import RecommendationsPage from './pages/RecommendationsPage'
import InventoryPage from './pages/InventoryPage'
import DealsPage from './pages/DealsPage'
import AIPage from './pages/AIPage'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  products: 'Products & Costs',
  recommendations: 'Pricing & Margins',
  inventory: 'Inventory',
  deals: 'Deal Simulator',
  ai: 'AI Insights',
}

export default function App() {
  const [auth, setAuth] = useState(null)
  const [authMode, setAuthMode] = useState('login') // 👈 NEW
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shop = params.get('shop')

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

  // 🔄 LOADING
  if (auth === null) {
    return (
      <div className="loading-center" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  // 🔐 AUTH FLOW (NEW)
  if (auth === false) {
    if (authMode === 'login') {
      return (
        <LoginPage
          onSwitch={() => setAuthMode('onboarding')}
          onLogin={(user) => setAuth(user)}
        />
      )
    }

    return (
      <OnboardingPage
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
      case 'ai': return <AIPage {...props} />
      default: return <DashboardPage {...props} onNavigate={setActivePage} />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        shop={auth.shop}
        isOpen={sidebarOpen}
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