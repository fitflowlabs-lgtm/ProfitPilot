import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api.js';

const icons = {
  home: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14H10v-3.5H6V14H2V6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>,
  products: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><rect x="8.5" y="2" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><rect x="2" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" /></svg>,
  inventory: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="5" width="13" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M5 5V3.5a3 3 0 0 1 6 0V5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M1.5 8.5h13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  deals: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" /><path d="M5.5 10.5l5-5M5.75 6.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zM10.25 11a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" /><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.42 1.42M11.18 11.18l1.42 1.42M12.6 3.4l-1.42 1.42M4.82 11.18l-1.42 1.42" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  support: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" /><path d="M8 9.5V9c0-1 .5-1.5 1.5-2a2 2 0 1 0-3-1.73" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="8" cy="11.5" r=".75" fill="currentColor" /></svg>,
  help: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.3" /><path d="M7.5 9V8.5C7.5 7.5 8 7 9 6.5a2 2 0 1 0-3-.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><circle cx="7.5" cy="11" r=".7" fill="currentColor" /></svg>,
  signout: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M6 1.5H2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h4M10 10.5l3-3-3-3M13 7.5H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  shop: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 3.5h10l-1 5H2.5l-1-5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><circle cx="4.5" cy="11" r=".8" fill="currentColor" /><circle cx="8.5" cy="11" r=".8" fill="currentColor" /></svg>,
  plus: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
};

function NavItem({ to, icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '7px 12px', borderRadius: 7,
        fontSize: '13.5px', fontWeight: isActive ? 600 : 500,
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        background: isActive ? 'var(--accent-subtle)' : 'transparent',
        textDecoration: 'none', transition: 'var(--transition)', marginBottom: 1,
      })}
      onMouseEnter={e => { if (e.currentTarget.getAttribute('aria-current') !== 'page') { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
      onMouseLeave={e => { if (e.currentTarget.getAttribute('aria-current') !== 'page') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
    >
      <span style={{ flexShrink: 0, opacity: 0.85 }}>{icon}</span>
      {label}
    </NavLink>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ padding: '14px 12px 5px', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
      {children}
    </div>
  );
}

function StoreChip({ store, isActive, onSelect }) {
  return (
    <button
      onClick={() => onSelect(store.shopDomain)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '7px 10px', borderRadius: 7, textAlign: 'left',
        background: isActive ? 'var(--accent-subtle)' : 'transparent',
        border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
        cursor: 'pointer', transition: 'var(--transition)',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? 'var(--green)' : 'var(--border)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12.5px', fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {store.name || store.shopDomain}
        </div>
        {store.name && store.name !== store.shopDomain && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {store.shopDomain}
          </div>
        )}
      </div>
    </button>
  );
}

export default function Sidebar({ user, stores, activeStore, onSwitchStore }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/api/logout'); } catch { /* ignore */ }
    navigate('/login');
  };

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, width: 'var(--sidebar-width)', height: '100vh',
      background: 'var(--surface)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', zIndex: 100, overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 12L8 4l5 8H3z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <span className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Margin Pilot
          </span>
        </div>
      </div>

      {/* Store switcher */}
      <div style={{ padding: '10px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 4px', marginBottom: 5 }}>
          Stores
        </div>
        {stores.length === 0 && activeStore && (
          <StoreChip store={activeStore} isActive onSelect={() => {}} />
        )}
        {stores.map(s => (
          <StoreChip
            key={s.shopDomain}
            store={s}
            isActive={activeStore?.shopDomain === s.shopDomain}
            onSelect={onSwitchStore}
          />
        ))}
        <a
          href="/auth"
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', borderRadius: 6, fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, textDecoration: 'none', marginTop: 3, transition: 'var(--transition)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-subtle)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = ''; }}
        >
          {icons.plus} Add store
        </a>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
        <NavItem to="/dashboard" end icon={icons.home} label="Dashboard" />

        <SectionLabel>Analyze</SectionLabel>
        <NavItem to="/products" icon={icons.products} label="Products" />
        <NavItem to="/inventory" icon={icons.inventory} label="Inventory" />
        <NavItem to="/deals" icon={icons.deals} label="Deals" />

        <SectionLabel>Account</SectionLabel>
        <NavItem to="/settings" icon={icons.settings} label="Settings" />

        {user?.role === 'admin' && (
          <>
            <SectionLabel>Admin</SectionLabel>
            <NavItem to="/support" icon={icons.support} label="Support" />
          </>
        )}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border-subtle)' }}>
        {user && (
          <div style={{ padding: '6px 10px', marginBottom: 4 }}>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name || user.email}
            </div>
            {user.name && (
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            )}
          </div>
        )}
        <a
          href="mailto:support@marginpilot.app"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500, textDecoration: 'none', transition: 'var(--transition)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          {icons.help} Get help
        </a>
        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 500, width: '100%', textAlign: 'left', transition: 'var(--transition)', marginTop: 1 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          {icons.signout} Sign out
        </button>
      </div>
    </aside>
  );
}
