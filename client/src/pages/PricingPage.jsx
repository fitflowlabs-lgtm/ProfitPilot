import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';

const FREE_FEATURES = [
  'Up to 500 products',
  'Real-time margin tracking',
  'Pricing recommendations',
  'Inventory alerts',
  'Shopify sync',
  '30-day order analysis',
];

const PRO_FEATURES = [
  'Everything in Free',
  'AI executive store summaries',
  'Per-product AI analysis',
  'AI inventory insights',
  'Deal simulation with sales lift',
  'Priority support',
];

function PlanCard({ name, price, period, description, features, cta, onCta, accent, badge }) {
  return (
    <div style={{
      background: accent ? 'var(--accent)' : 'var(--surface)',
      border: `1px solid ${accent ? 'transparent' : 'var(--border)'}`,
      borderRadius: 'var(--radius-xl)',
      padding: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      boxShadow: accent ? 'var(--shadow-lg)' : 'var(--shadow)',
      flex: 1,
      position: 'relative',
    }}>
      {badge && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          padding: '4px 14px', borderRadius: 20, background: 'var(--yellow)',
          fontSize: '11.5px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em', whiteSpace: 'nowrap',
        }}>
          {badge}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div className="font-display" style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: accent ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginBottom: 10 }}>
          {name}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
          <span className="mono" style={{ fontSize: '36px', fontWeight: 700, color: accent ? '#fff' : 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {price}
          </span>
          {period && <span style={{ fontSize: '14px', color: accent ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>{period}</span>}
        </div>
        <p style={{ fontSize: '13.5px', color: accent ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)', lineHeight: 1.5 }}>
          {description}
        </p>
      </div>

      <button
        onClick={onCta}
        style={{
          width: '100%',
          padding: '11px',
          borderRadius: 'var(--radius)',
          border: accent ? '1px solid rgba(255,255,255,0.3)' : '1px solid var(--accent)',
          background: accent ? 'rgba(255,255,255,0.15)' : 'var(--accent)',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'var(--transition)',
          marginBottom: 24,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = accent ? 'rgba(255,255,255,0.22)' : 'var(--accent-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = accent ? 'rgba(255,255,255,0.15)' : 'var(--accent)'; }}
      >
        {cta}
      </button>

      <div style={{ borderTop: `1px solid ${accent ? 'rgba(255,255,255,0.15)' : 'var(--border-subtle)'}`, paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {features.map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
              <path d="M2.5 7l3.5 3.5 5.5-7" stroke={accent ? 'rgba(255,255,255,0.8)' : 'var(--green)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: '13.5px', color: accent ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)', lineHeight: 1.4 }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();

  const handleFree = () => navigate('/onboarding');
  const handlePro = async () => {
    try {
      const data = await api.post('/api/stripe/create-checkout-session');
      if (data.url) window.location.href = data.url;
    } catch {
      navigate('/onboarding');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '64px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M3 12L8 4l5 8H3z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span className="font-display" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Margin Pilot
            </span>
          </Link>
          <h1 className="font-display" style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 12, lineHeight: 1.15 }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto' }}>
            Start for free. Upgrade when you need AI-powered insights to take your margins to the next level.
          </p>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'stretch', marginBottom: 48 }}>
          <PlanCard
            name="Free"
            price="$0"
            period=""
            description="Everything you need to track margins and optimize pricing for your Shopify store."
            features={FREE_FEATURES}
            cta="Start for free"
            onCta={handleFree}
          />
          <PlanCard
            name="Pro"
            price="$29"
            period="/mo"
            description="Unlock AI-powered analysis to surface insights and opportunities across your entire catalog."
            features={PRO_FEATURES}
            cta="Start Pro"
            onCta={handlePro}
            accent
            badge="Most popular"
          />
        </div>

        {/* FAQ */}
        <div style={{ textAlign: 'center', paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: 4 }}>
            Questions? Email us at{' '}
            <a href="mailto:support@marginpilot.app" style={{ color: 'var(--accent)', fontWeight: 600 }}>support@marginpilot.app</a>
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 14 }}>
            <Link to="/terms" style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Terms</Link>
            <Link to="/privacy" style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Privacy</Link>
            <Link to="/login" style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
