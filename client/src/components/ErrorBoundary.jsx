import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: 'var(--font-body)',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
            <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
              <rect width="30" height="30" rx="7" fill="#3B82F6"/>
              <path d="M7 22l5-9 5 6 3-4 3 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#E8ECF1', letterSpacing: '-0.02em', lineHeight: 1 }}>Margin Pilot</div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#5A6577', letterSpacing: '0.12em', marginTop: 3 }}>PROFITABILITY ENGINE</div>
            </div>
          </div>

          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#E8ECF1', marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#5A6577', lineHeight: 1.6, marginBottom: 28 }}>
            An unexpected error occurred. Reloading the page usually fixes it.
          </p>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 28px', background: '#3B82F6', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: '0.875rem',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
