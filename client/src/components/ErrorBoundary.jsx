import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 24,
        background: 'var(--bg)',
      }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 48px',
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {/* Logo */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--accent)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 19L12 5l8 14H4z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>

          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
            Something went wrong on this page
          </div>

          <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
            An unexpected error occurred. Your data is safe — reload the page to continue.
          </div>

          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 22px',
              borderRadius: 'var(--radius)',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
