import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api.js';

/* ─── Nav Icons ─── */
const icons = {
  home: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 6.5L8 2l6 4.5V14H10v-3.5H6V14H2V6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  products: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.5" y="2" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  recommendations: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v3M8 11v3M3.5 8H1M15 8h-2.5M5.05 5.05L3.29 3.29M12.71 12.71l-1.76-1.76M5.05 10.95L3.29 12.71M12.71 3.29l-1.76 1.76" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  inventory: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="5" width="13" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 5V3.5a3 3 0 0 1 6 0V5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M1.5 8.5h13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  deals: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 10.5l5-5M5.75 6.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zM10.25 11a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  ai: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9.5l-3 1.5.5-3.5L3 5l3.5-.5L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M3 13l2-1M13 13l-2-1M8 12v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.42 1.42M11.18 11.18l1.42 1.42M12.6 3.4l-1.42 1.42M4.82 11.18l-1.42 1.42" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  support: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 9.5V9c0-1 .5-1.5 1.5-2a2 2 0 1 0-3-1.73" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r=".75" fill="currentColor" />
    </svg>
  ),
  help: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7.5 9V8.5C7.5 7.5 8 7 9 6.5a2 2 0 1 0-3-.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="7.5" cy="11" r=".7" fill="currentColor" />
    </svg>
  ),
};

function NavItem({ to, icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '7px 12px',
        borderRadius: 7,
        fontSize: '13.5px',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        background: isActive ? 'var(--accent-subtle)' : 'transparent',
        textDecoration: 'none',
        transition: 'var(--transition)',
        marginBottom: 1,
      })}
      onMouseEnter={e => {
        const a = e.currentTarget;
        if (!a.classList.contains('active') && a.style.background === 'transparent') {
          a.style.background = 'var(--surface-hover)';
          a.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={e => {
        const a = e.currentTarget;
        if (a.getAttribute('aria-current') !== 'page') {
          a.style.background = 'transparent';
          a.style.color = 'var(--text-secondary)';
        }
      }}
    >
      <span style={{ flexShrink: 0, opacity: 0.85 }}>{icon}</span>
      {label}
    </NavLink>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      padding: '14px 12px 5px',
      fontSize: '10.5px',
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
    }}>
      {children}
    </div>
  );
}

export default function Sidebar({ user, stores, activeStore, onSwitchStore }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/api/logout');
    } catch {
      // ignore
    }
    navigate('/login');
  };

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: 'var(--sidebar-width)',
      height: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 12L8 4l5 8H3z" fill="white" fillOpacity="0.9" />
              <path d="M6 9.5l2-3 2 3" stroke="white" strokeWidth="1" strokeOpacity="0.5" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Margin Pilot
          </span>
        </div>
      </div>

      {/* Store switcher */}
      {activeStore && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{
            padding: '7px 10px',
            borderRadius: 7,
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            cursor: stores && stores.length > 1 ? 'pointer' : 'default',
          }}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              Active Store
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeStore.shopDomain || activeStore.name || 'My Store'}
            </div>
          </div>
          {stores && stores.length > 1 && (
            <div style={{ marginTop: 4 }}>
              {stores.filter(s => s.id !== activeStore.id).map(s => (
                <button
                  key={s.id}
                  onClick={() => onSwitchStore && onSwitchStore(s.id)}
                  style={{
                    width: '100%', padding: '5px 10px', textAlign: 'left', fontSize: '12px',
                    color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer',
                    borderRadius: 5,
                  }}
                >
                  Switch to {s.shopDomain}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
        <NavItem to="/dashboard" end icon={icons.home} label="Dashboard" />

        <SectionLabel>Analyze</SectionLabel>
        <NavItem to="/products" icon={icons.products} label="Products" />
        <NavItem to="/recommendations" icon={icons.recommendations} label="Recommendations" />
        <NavItem to="/inventory" icon={icons.inventory} label="Inventory" />
        <NavItem to="/deals" icon={icons.deals} label="Deals" />
        <NavItem to="/ai" icon={icons.ai} label="AI Analysis" />

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
          <div style={{ padding: '7px 10px', marginBottom: 6, borderRadius: 7 }}>
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
          {icons.help}
          Get help
        </a>
        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 500, width: '100%', textAlign: 'left', transition: 'var(--transition)', marginTop: 1 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M6 1.5H2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h4M10 10.5l3-3-3-3M13 7.5H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
