import { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import LoginPage from './pages/LoginPage'
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
  const [auth, setAuth] = useState(null) // null = loading, false = not auth'd, object = auth'd
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Check auth on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shop = params.get('shop')
    api.me(shop).then((data) => {
      if (data?.authenticated) {
        setAuth(data)
        // Clean URL
        if (shop) window.history.replaceState({}, '', '/')
      } else {
        setAuth(false)
      }
    }).catch(() => setAuth(false))
  }, [])

  const handleSync = useCallback(async () => {
    if (!auth?.shop || syncing) return
    setSyncing(true)
    try {
      const result = await api.syncAll(auth.shop)
      setAuth((prev) => ({ ...prev, ...result }))
      setRefreshKey((k) => k + 1)
    } catch (e) {
      console.error('Sync failed:', e)
    }
    setSyncing(false)
  }, [auth, syncing])

  const handleLogout = useCallback(async () => {
    await api.logout()
    setAuth(false)
  }, [])

  // Loading
  if (auth === null) {
    return (
      <div className="loading-center" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  // Not authenticated
  if (auth === false) {
    return <LoginPage />
  }

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
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => { setActivePage(page); setSidebarOpen(false) }}
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
