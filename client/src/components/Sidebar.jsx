import { useState } from 'react'

export default function Sidebar({ activePage, onNavigate, shop, shopName, isOpen, stores = [], onSwitchStore, onStoreConnected }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [newShop, setNewShop] = useState('')

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
    { section: 'Account', items: [
      { id: 'settings', label: 'Settings', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
      { id: 'support-admin', label: 'Support', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
    ]},
  ]

  const handleConnectStore = (e) => {
    e.preventDefault()
    let domain = newShop.trim().toLowerCase().replace(/\.myshopify\.com.*$/, '')
    if (!domain) return
    domain = `${domain}.myshopify.com`
    setDropdownOpen(false)
    setConnecting(false)
    setNewShop('')
    window.location.href = `/auth?shop=${encodeURIComponent(domain)}`
  }

  const otherStores = stores.filter((s) => s.shopDomain !== shop)

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
        {/* Store switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setDropdownOpen((o) => !o); setConnecting(false) }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              background: dropdownOpen ? 'var(--surface-raised)' : 'transparent',
              border: '1px solid var(--border)', borderRadius: 8,
              padding: '8px 10px', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div className="store-avatar" style={{ flexShrink: 0 }}>{initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="store-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              {stores.length > 1 && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{stores.length} stores</div>
              )}
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: 'var(--text-muted)', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
              background: 'var(--surface-raised)', border: '1px solid var(--border)',
              borderRadius: 10, overflow: 'hidden',
              boxShadow: '0 -8px 24px rgba(0,0,0,0.4)', zIndex: 100,
            }}>
              {/* Active store */}
              <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: otherStores.length > 0 || true ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
              </div>

              {/* Other stores */}
              {otherStores.map((s) => {
                const name = s.shopName || s.shopDomain.replace('.myshopify.com', '').replace(/-/g, ' ')
                return (
                  <button
                    key={s.shopDomain}
                    onClick={() => { onSwitchStore(s.shopDomain); setDropdownOpen(false) }}
                    style={{
                      width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                  </button>
                )
              })}

              {/* Connect new store */}
              {!connecting ? (
                <button
                  onClick={() => setConnecting(true)}
                  style={{
                    width: '100%', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8,
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="6" stroke="var(--accent)" strokeWidth="1.2"/>
                    <path d="M6.5 4v5M4 6.5h5" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600 }}>Connect new store</span>
                </button>
              ) : (
                <form onSubmit={handleConnectStore} style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    autoFocus
                    value={newShop}
                    onChange={(e) => setNewShop(e.target.value)}
                    placeholder="your-store-name"
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)',
                      fontSize: '0.8rem', fontFamily: 'var(--font-body)', width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '5px', fontSize: '0.78rem' }}>Connect</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1, padding: '5px', fontSize: '0.78rem' }} onClick={() => { setConnecting(false); setNewShop('') }}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
