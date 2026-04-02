export default function Sidebar({ activePage, onNavigate, shop, shopName, isOpen }) {
  const displayName = shopName || (shop ? shop.replace('.myshopify.com', '').replace(/-/g, ' ') : 'Unknown')
  const initial = displayName.charAt(0).toUpperCase()

  const navItems = [
    { section: 'Overview', items: [
      { id: 'dashboard', label: 'Dashboard', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    ]},
    { section: 'Products', items: [
      { id: 'products', label: 'Products & Costs', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> },
      { id: 'recommendations', label: 'Pricing & Margins', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
    ]},
    { section: 'Inventory', items: [
      { id: 'inventory', label: 'Inventory', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
    ]},
    { section: 'Promotions', items: [
      { id: 'deals', label: 'Deal Simulator', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg> },
    ]},
    { section: 'Intelligence', items: [
      { id: 'ai', label: 'AI Insights', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
    ]},
  ]

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-brand">
        <h1>Margin Pilot</h1>
        <p>Profitability Engine</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((group) => (
          <div key={group.section}>
            <div className="nav-section-label">{group.section}</div>
            {group.items.map((item) => (
              <button
                key={item.id}
                className={`nav-item${activePage === item.id ? ' active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="store-badge">
          <div className="store-avatar">{initial}</div>
          <div className="store-info">
            <div className="store-name">{displayName}</div>
            <div className="store-domain">{shop}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
