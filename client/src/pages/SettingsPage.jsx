import { useState, useEffect } from 'react';
import api from '../api.js';
import { useAuth } from '../App.jsx';
import { Button, Alert, Card, Badge, PageHeader, Skeleton } from '../components/UI.jsx';

function Section({ title, description, children }) {
  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{title}</div>
        {description && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{description}</div>}
      </div>
      {children}
    </Card>
  );
}

function FieldRow({ label, value, action, subtext }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
        {subtext && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>{subtext}</div>}
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
    <div className="page-content" style={{ maxWidth: 680 }}>
      <PageHeader title="Settings" subtitle="Manage your account, store, and subscription" />

      {(error || successMsg) && (
        <div style={{ marginBottom: 16 }}>
          {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
          {successMsg && <Alert type="success" message={successMsg} />}
        </div>
      )}

      {/* Profile */}
      <Section title="Profile" description="Your account details">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton height={40} /><Skeleton height={40} /><Skeleton height={40} />
          </div>
        ) : (
          <>
            <FieldRow label="Name" value={name} />
            <FieldRow
              label="Email"
              value={email}
              subtext={isVerified ? undefined : 'Not verified — check your inbox'}
              action={
                !isVerified && (
                  <Button variant="secondary" size="sm" loading={resendLoading} onClick={handleResendVerification}>
                    Resend verification
                  </Button>
                )
              }
            />
            <div style={{ paddingTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Email status:</span>
              {isVerified ? (
                <Badge color="green">Verified</Badge>
              ) : (
                <Badge color="yellow">Unverified</Badge>
              )}
            </div>
          </>
        )}
      </Section>

      {/* Subscription */}
      <Section title="Subscription" description="Your current plan and billing">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton height={40} /><Skeleton height={36} />
          </div>
        ) : (
          <>
            <FieldRow
              label="Current plan"
              value={plan}
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
              />
            )}
            {!isPro && (
              <div style={{ marginTop: 16, padding: '14px', borderRadius: 10, background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>Pro includes:</div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 5, marginLeft: 4 }}>
                  {['AI executive store summaries', 'Per-product AI analysis', 'AI inventory insights', 'Deal simulation with sales lift prediction'].map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '13px', color: 'var(--accent)' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Section>

      {/* Store */}
      <Section title="Connected Store" description="Your Shopify store connection">
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
            <div style={{ marginTop: 14 }}>
              <Button variant="secondary" size="sm" onClick={() => window.location.href = '/auth'}>
                Reconnect store
              </Button>
            </div>
          </>
        ) : (
          <div style={{ padding: '16px 0' }}>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: 14 }}>
              No Shopify store connected. Connect a store to start syncing products and orders.
            </p>
            <Button size="sm" onClick={() => window.location.href = '/auth'}>
              Connect Shopify store
            </Button>
          </div>
        )}
      </Section>

      {/* Danger Zone */}
      <Section title="Account" description="Account management options">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Need help? Contact us at{' '}
            <a href="mailto:support@marginpilot.app" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              support@marginpilot.app
            </a>
          </div>
        </div>
      </Section>
    </div>
  );
}
