import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import { LoadingSpinner, Button } from '../components/UI.jsx';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const [status, setStatus] = useState(token ? 'verifying' : 'pending');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const verify = async () => {
      try {
        await api.get(`/api/verify-email?token=${token}`);
        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (err) {
        setError(err.message || 'Verification failed. The link may have expired.');
        setStatus('error');
      }
    };
    verify();
  }, [token, navigate]);

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp 0.3s ease both', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 40 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 12L8 4l5 8H3z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <span className="font-display" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>Margin Pilot</span>
        </div>

        {status === 'verifying' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <LoadingSpinner size={32} />
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Verifying your email…</p>
          </div>
        )}

        {status === 'pending' && (
          <div>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-subtle)', border: '2px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <rect x="2" y="5" width="22" height="16" rx="3" stroke="var(--accent)" strokeWidth="1.8" />
                <path d="M2 9l11 7 11-7" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="font-display" style={{ fontSize: '22px', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>Check your inbox</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
              We sent a verification link to your email address. Click the link to activate your account.
            </p>
            <Link to="/login">
              <Button variant="secondary" size="md" style={{ minWidth: 160 }}>Back to sign in</Button>
            </Link>
          </div>
        )}

        {status === 'success' && (
          <div style={{ animation: 'fadeUp 0.3s ease both' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-bg)', border: '2px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M5 13l6 6 10-10" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="40" style={{ animation: 'checkDraw 0.4s ease 0.1s both' }} />
              </svg>
            </div>
            <h1 className="font-display" style={{ fontSize: '22px', fontWeight: 700, marginBottom: 8 }}>Email verified!</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 4 }}>Redirecting you to the dashboard…</p>
            <LoadingSpinner size={18} color="var(--green)" />
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--red-bg)', border: '2px solid var(--red-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M5 5l12 12M17 5L5 17" stroke="var(--red)" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="font-display" style={{ fontSize: '22px', fontWeight: 700, marginBottom: 8 }}>Verification failed</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 24 }}>{error || 'This link has expired or is invalid.'}</p>
            <Link to="/login">
              <Button size="md" style={{ minWidth: 160 }}>Back to sign in</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
