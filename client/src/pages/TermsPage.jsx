import { Link } from 'react-router-dom';

export default function TermsPage() {
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

        <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 36 }}>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        {[
          ['Acceptance', 'By accessing or using Margin Pilot, you agree to these terms. If you do not agree, do not use the service.'],
          ['Description', 'Margin Pilot is a SaaS tool that integrates with Shopify to help merchants track product costs, analyze profit margins, and optimize pricing decisions.'],
          ['Account Responsibilities', 'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must provide accurate information during registration.'],
          ['Shopify Integration', 'By connecting your Shopify store, you grant Margin Pilot read and write access to your product and order data. You may revoke this access at any time by uninstalling the app from your Shopify admin.'],
          ['Pricing & Billing', 'Free tier is provided at no cost. Pro subscriptions are billed monthly via Stripe. You may cancel at any time; cancellation takes effect at the end of your billing period.'],
          ['Data & Privacy', 'We store synced product and order data to provide the service. We do not sell your data to third parties. See our Privacy Policy for full details.'],
          ['AI Features', 'AI-generated analysis is provided for informational purposes only. Margin Pilot makes no guarantees about the accuracy or appropriateness of AI recommendations. Always use your own judgment for pricing decisions.'],
          ['Limitation of Liability', 'Margin Pilot is provided "as is." We are not liable for any business decisions made based on data or analysis provided by the service, including pricing errors or inventory decisions.'],
          ['Changes', 'We may update these terms. Continued use after changes constitutes acceptance. We will notify users of material changes.'],
          ['Contact', 'Questions? Email support@marginpilot.app'],
        ].map(([title, content]) => (
          <div key={title} style={{ marginBottom: 28 }}>
            <h2 className="font-display" style={{ fontSize: '16px', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>{title}</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{content}</p>
          </div>
        ))}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 20 }}>
          <Link to="/privacy" style={{ fontSize: '13.5px', color: 'var(--accent)', fontWeight: 600 }}>Privacy Policy</Link>
          <Link to="/pricing" style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>Pricing</Link>
          <Link to="/login" style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
