import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/UI.jsx';

export default function StoreErrorPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const message = params.get('message') || 'There was a problem connecting to your Shopify store.';

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center', animation: 'fadeUp 0.3s ease both' }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'var(--red-bg)',
          border: '1px solid var(--red-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 8v7M14 18v2" stroke="var(--red)" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M4.5 23L14 7l9.5 16H4.5z" stroke="var(--red)" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="font-display" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 10 }}>
          Store connection failed
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
          {message}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button size="md" onClick={() => window.location.href = '/auth'} style={{ width: '100%' }}>
            Try connecting again
          </Button>
          <Button variant="secondary" size="md" onClick={() => navigate('/settings')} style={{ width: '100%' }}>
            Go to Settings
          </Button>
          <a
            href="mailto:support@marginpilot.app"
            style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontWeight: 500, marginTop: 4 }}
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
