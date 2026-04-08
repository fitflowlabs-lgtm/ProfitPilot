import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '56px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 12L8 4l5 8H3z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <span className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Margin Pilot</span>
        </Link>

        <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 36 }}>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        {[
          ['What we collect', 'We collect your email address, name, and password (hashed) when you register. When you connect a Shopify store, we sync product, variant, and order data to calculate margin metrics.'],
          ['How we use it', 'Your data is used solely to operate the Margin Pilot service — to calculate margins, generate recommendations, and provide AI analysis. We do not use your data for advertising.'],
          ['Data storage', 'Data is stored in a PostgreSQL database hosted on a secure cloud provider. We retain data as long as your account is active. You may request deletion at any time.'],
          ['Third-party services', 'We use Stripe for payment processing, OpenAI for AI analysis (product data may be sent to OpenAI), Shopify for store data, and Zoho for email delivery. Each has their own privacy policy.'],
          ['AI analysis', 'When you use AI features, product and order summary data is sent to OpenAI\'s API. We do not share personally identifiable customer information with OpenAI.'],
          ['Cookies', 'We use a single session cookie to maintain your logged-in state. No tracking or advertising cookies are used.'],
          ['Your rights', 'You may request access to, correction of, or deletion of your personal data at any time by emailing support@marginpilot.app. We will respond within 30 days.'],
          ['Data deletion', 'If you uninstall the Margin Pilot Shopify app, your store data is automatically deleted from our systems. Account data can be deleted on request.'],
          ['Contact', 'Privacy questions? Email support@marginpilot.app'],
        ].map(([title, content]) => (
          <div key={title} style={{ marginBottom: 28 }}>
            <h2 className="font-display" style={{ fontSize: '16px', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>{title}</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{content}</p>
          </div>
        ))}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 20 }}>
          <Link to="/terms" style={{ fontSize: '13.5px', color: 'var(--accent)', fontWeight: 600 }}>Terms of Service</Link>
          <Link to="/pricing" style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>Pricing</Link>
          <Link to="/login" style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
