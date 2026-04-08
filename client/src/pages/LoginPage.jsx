import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../App.jsx';
import { Button, Alert } from '../components/UI.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/login', { email, password });
      await refresh();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div style={{
        width: '100%',
        maxWidth: 400,
        animation: 'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M3 12L8 4l5 8H3z" fill="white" fillOpacity="0.9" />
                <path d="M6 9.5l2-3 2 3" stroke="white" strokeWidth="1" strokeOpacity="0.5" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Margin Pilot
            </span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400 }}>
            Know your margins. Price with confidence.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <h2 className="font-display" style={{ fontSize: '17px', fontWeight: 700, marginBottom: 22, color: 'var(--text-primary)' }}>
            Sign in
          </h2>

          {error && (
            <div style={{ marginBottom: 16 }}>
              <Alert type="error" message={error} onDismiss={() => setError('')} />
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@store.com" autoComplete="email" required />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" required />

            <Button type="submit" loading={loading} size="lg" style={{ width: '100%', marginTop: 4 }}>
              Sign in
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '13.5px', color: 'var(--text-muted)' }}>
          New here?{' '}
          <Link to="/onboarding" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            Create an account
          </Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: '13.5px', color: 'var(--text-muted)' }}>
          Installing via Shopify?{' '}
          <a href="/auth" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            Connect your store
          </a>
        </p>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder, autoComplete, required }) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.01em' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
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
