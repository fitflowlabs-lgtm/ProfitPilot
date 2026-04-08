import { useLocation } from 'react-router-dom';
import { Button } from './UI.jsx';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/inventory': 'Inventory',
  '/deals': 'Deals',
  '/settings': 'Settings',
  '/support': 'Support',
};

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Header({ user, store, onSync, syncing }) {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'Margin Pilot';
  const lastSynced = store?.lastProductsSyncAt ? timeAgo(store.lastProductsSyncAt) : null;

  return (
    <header style={{
      height: 'var(--header-height)', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px 0 32px', position: 'sticky', top: 0, zIndex: 50, gap: 16,
    }}>
      <h1 className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
        {title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {store && onSync && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {lastSynced && (
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Last synced {lastSynced}
              </span>
            )}
            <Button variant="secondary" size="sm" loading={syncing} onClick={onSync}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
                <path d="M11.5 2.5A5.5 5.5 0 0 0 1 6.5M1.5 10.5A5.5 5.5 0 0 0 12 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M11 0.5v2.5H8.5M2 12.5v-2.5H4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {syncing ? 'Syncing…' : 'Sync'}
            </Button>
          </div>
        )}

        {store && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 6,
            background: 'var(--surface-raised)', border: '1px solid var(--border)',
            fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)',
            maxWidth: 200, overflow: 'hidden',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, animation: 'livePulse 2s ease-in-out infinite' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {store.name || store.shopDomain}
            </span>
          </div>
        )}

        {user?.plan === 'pro' && (
          <div style={{ padding: '3px 8px', borderRadius: 4, fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
            Pro
          </div>
        )}
      </div>
    </header>
  );
}
