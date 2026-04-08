import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/UI.jsx';

const PRO_HIGHLIGHTS = [
  { icon: '✦', text: 'AI executive store summaries' },
  { icon: '→', text: 'Per-product pricing analysis' },
  { icon: '◎', text: 'AI inventory insights' },
  { icon: '⊕', text: 'Sales lift predictions for deals' },
];

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="auth-page">
      <div style={{
        width: '100%',
        maxWidth: 460,
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Success animation */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--green-bg)',
            border: '2px solid var(--green-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}>
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <path
                d="M7 17l7 7 13-14"
                stroke="var(--green)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="40"
                style={{ animation: 'checkDraw 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' }}
              />
            </svg>
          </div>
        </div>

        <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 10, color: 'var(--text-primary)' }}>
          You're on Pro!
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
          Your subscription is active. All AI features are now unlocked — start with a store summary to see what's working and what isn't.
        </p>

        {/* Highlights */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          marginBottom: 28,
          textAlign: 'left',
          boxShadow: 'var(--shadow)',
        }}>
          <div className="font-display" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
            Now unlocked
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PRO_HIGHLIGHTS.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: 'var(--accent-subtle)',
                  border: '1px solid var(--accent-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: 'var(--accent)',
                  flexShrink: 0,
                }}>
                  {h.icon}
                </div>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{h.text}</span>
              </div>
            ))}
          </div>
        </div>

        <Button size="lg" onClick={() => navigate('/dashboard')} style={{ minWidth: 220 }}>
          Go to Dashboard →
        </Button>
      </div>
    </div>
  );
}
