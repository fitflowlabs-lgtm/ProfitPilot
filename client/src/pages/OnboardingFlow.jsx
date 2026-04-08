import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import { Button, Alert, LoadingSpinner } from '../components/UI.jsx';

const STEPS = ['Create account', 'Connect Shopify', 'Sync products'];

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: done ? 'var(--accent)' : active ? 'var(--surface)' : 'var(--surface-raised)',
                border: done ? '2px solid var(--accent)' : active ? '2px solid var(--accent)' : '2px solid var(--border)',
                fontSize: '12px',
                fontWeight: 700,
                color: done ? '#fff' : active ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'var(--transition)',
              }}>
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (i + 1)}
              </div>
              <span style={{ fontSize: '11px', fontWeight: active ? 600 : 400, color: active ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? 'var(--accent)' : 'var(--border)', margin: '0 8px', marginBottom: 20, transition: 'background 0.3s ease' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: '9px 12px',
          border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          fontSize: '14px',
          color: 'var(--text-primary)',
          background: 'var(--surface)',
          outline: 'none',
          boxShadow: focused ? '0 0 0 3px var(--accent-subtle)' : 'none',
          transition: 'var(--transition)',
        }}
      />
    </div>
  );
}

/* ─── Step 1: Create Account ─── */
function Step1({ onNext }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/api/register', { name, email, password });
      onNext();
    } catch (err) {
      setError(err.message || 'Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h2 className="font-display" style={{ fontSize: '20px', fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>Create your account</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Start tracking your store's margins in minutes.</p>
      </div>
      {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
      <InputField label="Your name" value={name} onChange={setName} placeholder="Alex Johnson" autoComplete="name" />
      <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@store.com" autoComplete="email" />
      <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="8+ characters" autoComplete="new-password" />
      <Button type="submit" loading={loading} size="lg" style={{ width: '100%', marginTop: 4 }}>
        Create account →
      </Button>
      <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        By creating an account you agree to our{' '}
        <Link to="/terms" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'underline' }}>Terms of Service</Link>
        {' '}and{' '}
        <Link to="/privacy" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'underline' }}>Privacy Policy</Link>.
      </p>
      <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
      </p>
    </form>
  );
}

/* ─── Step 2: Connect Shopify ─── */
function Step2({ onNext }) {
  const [shop, setShop] = useState('');
  const [focused, setFocused] = useState(false);

  const handleConnect = (e) => {
    e.preventDefault();
    let domain = shop.trim().toLowerCase();
    if (!domain.includes('.myshopify.com')) {
      domain = `${domain}.myshopify.com`;
    }
    window.location.href = `/auth?shop=${domain}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 className="font-display" style={{ fontSize: '20px', fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>Connect your Shopify store</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>We'll sync your products, variants, and order history to calculate real margins.</p>
      </div>

      {/* Shopify card */}
      <div style={{
        padding: '24px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-raised)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          {/* Shopify bag icon */}
          <div style={{ width: 40, height: 40, background: '#96BF48', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M15.337 23.979l6.43-1.394c0 0-2.353-15.9-2.375-16.009a.25.25 0 0 0-.246-.211c-.113 0-2.01-.042-2.01-.042s-1.337-1.295-1.479-1.432v19.088z"/>
              <path d="M12.667 7.523s-1.019-.305-2.196-.305c-1.8 0-1.894 1.132-1.894 1.418 0 1.555 4.055 2.15 4.055 5.793 0 2.863-1.818 4.707-4.27 4.707-2.945 0-4.446-1.834-4.446-1.834l.787-2.594s1.546 1.328 2.849 1.328c.852 0 1.205-.673 1.205-1.164 0-2.031-3.327-2.12-3.327-5.459 0-2.807 2.018-5.527 6.097-5.527 1.568 0 2.346.449 2.346.449L12.667 7.523z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Shopify</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>OAuth 2.0 · Read & write products</div>
          </div>
        </div>

        <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Your store URL</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={shop}
              onChange={e => setShop(e.target.value)}
              placeholder="your-store"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              required
              style={{
                flex: 1,
                padding: '9px 12px',
                border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                fontSize: '14px',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                outline: 'none',
                boxShadow: focused ? '0 0 0 3px var(--accent-subtle)' : 'none',
                transition: 'var(--transition)',
              }}
            />
            <span style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '13.5px', color: 'var(--text-muted)', background: 'var(--surface-raised)', whiteSpace: 'nowrap' }}>
              .myshopify.com
            </span>
          </div>
          <Button type="submit" size="lg" style={{ width: '100%', marginTop: 6 }}>
            Connect with Shopify →
          </Button>
        </form>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--radius)', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="var(--accent)" strokeWidth="1.3" />
          <path d="M7 4v3.5M7 9.5v.5" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: '12.5px', color: 'var(--accent)', fontWeight: 500 }}>
          We request read and write access to manage product prices on your behalf.
        </span>
      </div>

      <button onClick={onNext} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'underline' }}>
        Skip for now — connect later in Settings
      </button>
    </div>
  );
}

/* ─── Step 3: Sync ─── */
function Step3() {
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    try {
      await api.post('/api/sync/all');
      setDone(true);
    } catch (err) {
      setError(err.message || 'Sync failed. You can try again from the dashboard.');
    } finally {
      setSyncing(false);
    }
  };

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0', animation: 'fadeUp 0.3s ease both' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-bg)', border: '2px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M6 14l6 6 10-10" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="40" style={{ animation: 'checkDraw 0.4s ease 0.1s both' }} />
          </svg>
        </div>
        <h2 className="font-display" style={{ fontSize: '20px', fontWeight: 700, marginBottom: 8 }}>You're all set!</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 28 }}>
          Your products and orders have been synced. Start adding costs to see your real margins.
        </p>
        <Button size="lg" onClick={() => navigate('/dashboard')} style={{ minWidth: 200 }}>
          Go to Dashboard →
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 className="font-display" style={{ fontSize: '20px', fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>Sync your products</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          Import your product catalog and order history so Margin Pilot can calculate 30-day metrics.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', gap: 14 }}>
        {syncing ? (
          <LoadingSpinner size={24} />
        ) : (
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M7 3l3 3-3 3" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
            {syncing ? 'Syncing your store…' : 'Ready to sync'}
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Products, variants, inventory, and last 30 days of orders
          </div>
        </div>
      </div>

      <Button size="lg" loading={syncing} onClick={handleSync} style={{ width: '100%' }}>
        {syncing ? 'Syncing…' : 'Sync now'}
      </Button>

      <button
        onClick={() => navigate('/dashboard')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'underline' }}
      >
        Skip — I'll sync from the dashboard
      </button>
    </div>
  );
}

/* ─── Main ─── */
export default function OnboardingFlow() {
  const [step, setStep] = useState(0);

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: 48 }}>
      <div style={{ width: '100%', maxWidth: 480, animation: 'fadeUp 0.3s ease both' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 12L8 4l5 8H3z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <span className="font-display" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Margin Pilot
          </span>
        </div>

        <StepIndicator current={step} />

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {step === 0 && <Step1 onNext={() => setStep(1)} />}
          {step === 1 && <Step2 onNext={() => setStep(2)} />}
          {step === 2 && <Step3 />}
        </div>

        {step === 0 && (
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
