import { useState } from 'react'

const NAV = [
  {
    section: 'Overview',
    items: [
      {
        id: 'dashboard', label: 'Dashboard',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
      },
    ],
  },
  {
    section: 'Products',
    items: [
      {
        id: 'products', label: 'Products & Costs',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1" fill="currentColor" stroke="none"/></svg>,
      },
      {
        id: 'recommendations', label: 'Pricing & Margins',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
      },
    ],
  },
  {
    section: 'Inventory',
    items: [
      {
        id: 'inventory', label: 'Inventory',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
      },
    ],
  },
  {
    section: 'Promotions',
    items: [
      {
        id: 'deals', label: 'Deal Simulator',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
      },
    ],
  },
  {
    section: 'Account',
    items: [
      {
        id: 'settings', label: 'Settings',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
      },
    ],
  },
]

export default function Sidebar({ activePage, onNavigate, shop, shopName, isOpen, stores = [], onSwitchStore, onStoreConnected, role }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [newShop, setNewShop] = useState('')

  const displayName = shopName || (shop ? shop.replace('.myshopify.com', '').replace(/-/g, ' ') : 'Unknown')
  const initial = displayName.charAt(0).toUpperCase()
  const otherStores = stores.filter(s => s.shopDomain !== shop)

  const navItems = [
    ...NAV,
    ...(role === 'admin' ? [{
      section: 'Admin',
      items: [{
        id: 'support-admin', label: 'Support',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
      }],
    }] : []),
  ]

  const handleConnectStore = (e) => {
    e.preventDefault()
    let domain = newShop.trim().toLowerCase().replace(/\.myshopify\.com.*$/, '')
    if (!domain) return
    setDropdownOpen(false)
    setConnecting(false)
    setNewShop('')
    window.location.href = `/auth?shop=${encodeURIComponent(domain + '.myshopify.com')}`
  }

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>

      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M7 22l5-9 5 6 3-4 3 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="sidebar-brand-text">
          <h1>Margin Pilot</h1>
          <p>Profitability Engine</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(group => (
          <div key={group.section}>
            <div className="nav-section-label">{group.section}</div>
            {group.items.map(item => (
              <button
                key={item.id}
                className={`nav-item${activePage === item.id ? ' active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Store switcher */}
      <div className="sidebar-footer">
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setDropdownOpen(o => !o); setConnecting(false) }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9,
              background: dropdownOpen ? 'var(--surface-raised)' : 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: '8px 10px',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
          >
            <div className="store-avatar">{initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="store-name">{displayName}</div>
              {stores.length > 1 && (
                <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: 1 }}>{stores.length} stores</div>
              )}
            </div>
            <svg
              width="11" height="11" viewBox="0 0 12 12" fill="none"
              style={{ flexShrink: 0, color: 'var(--text-muted)', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1)' }}
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, overflow: 'hidden',
              boxShadow: '0 -8px 24px rgba(26,20,10,0.12)',
              zIndex: 100,
            }}>
              {/* Active store */}
              <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                <span style={{ fontSize: '0.81rem', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
              </div>

              {/* Other stores */}
              {otherStores.map(s => {
                const name = s.shopName || s.shopDomain.replace('.myshopify.com', '').replace(/-/g, ' ')
                return (
                  <button
                    key={s.shopDomain}
                    onClick={() => { onSwitchStore(s.shopDomain); setDropdownOpen(false) }}
                    style={{ width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--border)', display: 'inline-block' }} />
                    <span style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                  </button>
                )
              })}

              {!connecting ? (
                <button
                  onClick={() => setConnecting(true)}
                  style={{ width: '100%', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="6" stroke="var(--accent)" strokeWidth="1.2"/>
                    <path d="M6.5 4v5M4 6.5h5" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize: '0.81rem', color: 'var(--accent)', fontWeight: 600 }}>Connect new store</span>
                </button>
              ) : (
                <form onSubmit={handleConnectStore} style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    autoFocus value={newShop}
                    onChange={e => setNewShop(e.target.value)}
                    placeholder="your-store-name"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontSize: '0.8rem', fontFamily: 'var(--font-body)', width: '100%', boxSizing: 'border-box', outline: 'none' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-subtle)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>Connect</button>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => { setConnecting(false); setNewShop('') }}>Cancel</button>
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
