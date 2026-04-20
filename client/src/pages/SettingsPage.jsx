import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../App.jsx';
import { Button, Alert, Card, Badge, PageHeader, Skeleton } from '../components/UI.jsx';

function Section({ title, description, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 10 }}>
        <div className="font-display" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
        {description && <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function FieldRow({ label, value, action, subtext, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: last ? 'none' : '1px solid var(--border-subtle)', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
        <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
        {subtext && <div style={{ fontSize: '12px', color: 'var(--yellow)', marginTop: 3 }}>{subtext}</div>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

export default function SettingsPage() {
  const { user, store, refresh } = useAuth();
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookResult, setWebhookResult] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileData, subData] = await Promise.all([
          api.get('/api/me/profile'),
          api.get('/api/stripe/subscription'),
        ]);
        setProfile(profileData);
        setSubscription(subData);
      } catch {
        // fail silently, use user from context
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await api.post('/api/resend-verification');
      setSuccessMsg('Verification email sent. Check your inbox.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const data = await api.post('/api/stripe/portal');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err.message);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleRegisterWebhooks = async () => {
    setWebhookLoading(true);
    setWebhookResult(null);
    try {
      const data = await api.post('/api/webhooks/register');
      setWebhookResult({ type: 'success', message: data.message || 'Webhooks registered successfully.' });
    } catch (err) {
      setWebhookResult({ type: 'error', message: err.message || 'Failed to register webhooks.' });
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const data = await api.post('/api/stripe/create-checkout-session');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err.message);
    }
  };

  const isPro = (profile?.plan || user?.plan) === 'pro';
  const isVerified = profile?.emailVerified ?? user?.emailVerified;
  const email = profile?.email || user?.email || '—';
  const name = profile?.name || user?.name || '—';
  const plan = isPro ? 'Pro' : 'Free';

  return (
    <div className="page-content" style={{ maxWidth: 620 }}>
      <PageHeader title="Settings" subtitle="Manage your account, store, and subscription" />

      {(error || successMsg) && (
        <div style={{ marginBottom: 20 }}>
          {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
          {successMsg && <Alert type="success" message={successMsg} />}
        </div>
      )}

      {/* Profile */}
      <Section title="Profile">
        {loading ? (
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton height={40} /><Skeleton height={40} />
          </div>
        ) : (
          <>
            <FieldRow label="Name" value={name} />
            <FieldRow
              label="Email"
              value={email}
              subtext={isVerified ? undefined : 'Not verified — check your inbox'}
              action={
                isVerified
                  ? <Badge color="green">Verified</Badge>
                  : <Button variant="secondary" size="sm" loading={resendLoading} onClick={handleResendVerification}>Resend</Button>
              }
              last
            />
          </>
        )}
      </Section>

      {/* Subscription */}
      <Section title="Subscription">
        {loading ? (
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton height={40} /><Skeleton height={36} />
          </div>
        ) : (
          <>
            <FieldRow
              label="Current plan"
              value={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {plan}
                  {isPro && <Badge color="green">Active</Badge>}
                </span>
              }
              action={
                isPro ? (
                  <Button variant="secondary" size="sm" loading={portalLoading} onClick={handleBillingPortal}>
                    Manage billing
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleUpgrade}>
                    Upgrade to Pro
                  </Button>
                )
              }
            />
            {isPro && subscription?.currentPeriodEnd && (
              <FieldRow
                label="Renews"
                value={new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                last
              />
            )}
            {!isPro && (
              <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>Pro includes</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {['AI executive store summaries', 'Per-product AI analysis', 'AI inventory insights', 'Deal simulation with lift prediction'].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Section>

      {/* Connected Store */}
      <Section title="Connected Store">
        {store ? (
          <>
            <FieldRow
              label="Store domain"
              value={store.shopDomain || store.name}
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                  <span style={{ fontSize: '12.5px', color: 'var(--green)', fontWeight: 600 }}>Connected</span>
                </div>
              }
            />
            <FieldRow
              label="Webhooks"
              value="Shopify event listeners"
              action={
                <Button variant="secondary" size="sm" loading={webhookLoading} onClick={handleRegisterWebhooks}>
                  Re-register
                </Button>
              }
              last={!webhookResult}
            />
            {webhookResult && (
              <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border-subtle)' }}>
                <Alert type={webhookResult.type} message={webhookResult.message} onDismiss={() => setWebhookResult(null)} />
              </div>
            )}
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)' }}>
              <Button variant="secondary" size="sm" onClick={() => window.location.href = '/auth'}>
                Reconnect store
              </Button>
            </div>
          </>
        ) : (
          <div style={{ padding: '20px 18px' }}>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: 14 }}>
              No Shopify store connected. Connect one to start syncing.
            </p>
            <Button size="sm" onClick={() => window.location.href = '/auth'}>
              Connect Shopify store
            </Button>
          </div>
        )}
      </Section>

      {/* Support */}
      <Section title="Support">
        <div style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Questions or issues? Reach us at{' '}
            <a href="mailto:support@marginpilot.app" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              support@marginpilot.app
            </a>
          </div>
        </div>
      </Section>

      {/* Legal */}
      <Section title="Legal">
        <div style={{ padding: '14px 18px', display: 'flex', gap: 20 }}>
          <Link to="/terms" style={{ fontSize: '13.5px', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            Terms of Service
          </Link>
          <Link to="/privacy" style={{ fontSize: '13.5px', color: 'var(--text-secondary)', fontWeight: 500, textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            Privacy Policy
          </Link>
        </div>
      </Section>
    </div>
  );
}
