export default function Header({ title, syncing, lastSync, onSync, onLogout, onToggleSidebar }) {
  const syncLabel = lastSync ? `Synced ${timeAgo(new Date(lastSync))}` : 'Never synced'

  return (
    <header className="header-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Mobile hamburger */}
        <button
          className="btn btn-ghost btn-sm hamburger-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <line x1="3" y1="8"  x2="21" y2="8"/>
            <line x1="3" y1="14" x2="16" y2="14"/>
          </svg>
        </button>

        <h2 className="header-title">{title}</h2>
      </div>

      <div className="header-actions">
        {/* Live sync indicator */}
        <div className="sync-pill">
          <span
            className="sync-dot"
            style={syncing ? { animation: 'spin 1s linear infinite', background: 'var(--accent)' } : {}}
          />
          {syncing ? 'Syncing…' : syncLabel}
        </div>

        <button
          className="btn btn-ghost btn-sm"
          onClick={onSync}
          disabled={syncing}
          title="Sync Shopify data"
        >
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
            style={syncing ? { animation: 'spin 1s linear infinite' } : {}}
          >
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Sync
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} />

        <button
          className="btn btn-ghost btn-sm"
          onClick={onLogout}
          style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}
        >
          Sign out
        </button>
      </div>
    </header>
  )
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
