const ERROR_MESSAGES = {
  invalid_domain: {
    title: "Invalid store domain",
    body: "The Shopify store domain doesn't look right. Make sure you're using the format your-store.myshopify.com.",
  },
  missing_shop: {
    title: "No store specified",
    body: "We couldn't find a store to connect to. Head back and enter your Shopify store name to get started.",
  },
  missing_params: {
    title: "Connection incomplete",
    body: "The Shopify authorization was incomplete. This can happen if the page was refreshed mid-flow. Please try again.",
  },
  auth_failed: {
    title: "Authorization failed",
    body: "Shopify couldn't verify the request. This is usually a temporary issue — please try connecting your store again.",
  },
  expired: {
    title: "Session expired",
    body: "Your connection session expired before it could complete. This happens if the flow takes too long. Please start again.",
  },
  store_not_found: {
    title: "This store isn't connected yet",
    body: "We don't have a record of this store in Margin Pilot. Connect it below to start tracking your margins.",
  },
}

export default function StoreErrorPage({ errorCode, shop, onConnect, onLogin }) {
  const { title, body } = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.store_not_found

  return (
    <div style={{
      minHeight: '100vh', background: '#0B0E11',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem', fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>

        {/* Logo */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <svg width="32" height="32" viewBox="0 0 30 30" fill="none">
            <rect width="30" height="30" rx="7" fill="#3B82F6"/>
            <path d="M7 22l5-9 5 6 3-4 3 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#E8ECF1', letterSpacing: '-0.02em', lineHeight: 1 }}>Margin Pilot</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#5A6577', letterSpacing: '0.12em', marginTop: 3 }}>PROFITABILITY ENGINE</div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#13171C', border: '1px solid #252B35',
          borderRadius: 16, padding: '36px 40px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}>
          {/* Icon */}
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#E8ECF1', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#8B95A5', lineHeight: 1.7, margin: '0 0 28px' }}>
            {body}
          </p>

          {shop && (
            <div style={{
              background: '#1A1F26', border: '1px solid #252B35', borderRadius: 8,
              padding: '10px 14px', marginBottom: 24,
              fontSize: '0.8rem', color: '#5A6577', fontFamily: 'monospace',
            }}>
              {shop}
            </div>
          )}

          {/* Primary CTA */}
          <button
            onClick={onConnect}
            style={{
              width: '100%', padding: '12px', border: 'none', borderRadius: 10,
              background: '#3B82F6', color: '#fff', cursor: 'pointer',
              fontSize: '0.95rem', fontWeight: 600, fontFamily: 'inherit',
              transition: 'background 0.2s', marginBottom: 10,
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#5B9BFF'}
            onMouseOut={(e) => e.currentTarget.style.background = '#3B82F6'}
          >
            Connect a Store
          </button>

          {/* Secondary CTA */}
          <button
            onClick={onLogin}
            style={{
              width: '100%', padding: '11px', border: '1px solid #252B35', borderRadius: 10,
              background: 'transparent', color: '#8B95A5', cursor: 'pointer',
              fontSize: '0.88rem', fontWeight: 500, fontFamily: 'inherit',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.color = '#E8ECF1' }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#252B35'; e.currentTarget.style.color = '#8B95A5' }}
          >
            Back to Sign In
          </button>
        </div>

        <p style={{ marginTop: 20, fontSize: '0.75rem', color: '#5A6577' }}>
          Need help?{' '}
          <a href="mailto:support@marginpilot.co" style={{ color: '#3B82F6', textDecoration: 'none' }}>
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}
