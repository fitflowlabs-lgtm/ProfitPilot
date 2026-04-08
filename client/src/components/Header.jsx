import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api.js';
import { Button } from './UI.jsx';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/recommendations': 'Recommendations',
  '/inventory': 'Inventory',
  '/deals': 'Deals',
  '/ai': 'AI Analysis',
  '/settings': 'Settings',
  '/support': 'Support',
};

export default function Header({ user, store, onSync, syncing }) {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'Margin Pilot';

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px 0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      gap: 16,
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 className="font-display" style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h1>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Sync button */}
        {store && onSync && (
          <Button
            variant="secondary"
            size="sm"
            loading={syncing}
            onClick={onSync}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
              <path d="M11.5 2.5A5.5 5.5 0 0 0 1 6.5M1.5 10.5A5.5 5.5 0 0 0 12 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M11 0.5v2.5H8.5M2 12.5v-2.5H4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {syncing ? 'Syncing…' : 'Sync'}
          </Button>
        )}

        {/* Store chip */}
        {store && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 6,
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            fontSize: '12.5px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            maxWidth: 200,
            overflow: 'hidden',
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--green)',
              flexShrink: 0,
              animation: 'livePulse 2s ease-in-out infinite',
            }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {store.shopDomain || store.name}
            </span>
          </div>
        )}

        {/* Plan badge */}
        {user?.plan === 'pro' && (
          <div style={{
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            background: 'var(--accent-subtle)',
            color: 'var(--accent)',
            border: '1px solid var(--accent-border)',
          }}>
            Pro
          </div>
        )}
      </div>
    </header>
  );
}
