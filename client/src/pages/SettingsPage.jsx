import { useState, useEffect } from 'react'
import { api } from '../api'
import { Loading } from '../components/UI'

function Section({ title, children }) {
  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div className="panel-header">
        <span className="panel-title">{title}</span>
      </div>
      <div className="panel-body" style={{ padding: '20px 24px' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 550 }}>{value}</span>
    </div>
  )
}

export default function SettingsPage({ stores = [], onNavigate }) {
  const [profile, setProfile] = useState(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.profile().then(setProfile).catch(() => setProfile(null))
  }, [])

  const handleManageSubscription = async () => {
    setError('')
    setPortalLoading(true)
    try {
      const result = await api.getBillingPortal()
      if (result?.url) window.location.href = result.url
    } catch (e) {
      setError(e.message || 'Failed to open billing portal.')
    }
    setPortalLoading(false)
  }

  const handleUpgrade = async () => {
    setError('')
    setUpgradeLoading(true)
    try {
      const result = await api.createCheckoutSession()
      if (result?.url) window.location.href = result.url
    } catch (e) {
      setError(e.message || 'Failed to start checkout.')
    }
    setUpgradeLoading(false)
  }

  if (!profile) return <div className="page"><Loading /></div>

  const isPro = profile.plan === 'pro'

  return (
    <div className="page" style={{ maxWidth: 600 }}>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {/* User Info */}
      <Section title="Account">
        <Row label="Name" value={profile.name} />
        <Row label="Email" value={profile.email} />
      </Section>

      {/* Subscription */}
      <Section title="Subscription">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current plan</span>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em',
            padding: '3px 10px', borderRadius: 20,
            background: isPro ? 'rgba(59,130,246,0.12)' : 'var(--surface-raised)',
            color: isPro ? 'var(--accent)' : 'var(--text-muted)',
            border: `1px solid ${isPro ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
          }}>
            {isPro ? 'PRO' : 'FREE'}
          </span>
        </div>

        {isPro ? (
          <button
            className="btn btn-secondary"
            onClick={handleManageSubscription}
            disabled={portalLoading}
            style={{ opacity: portalLoading ? 0.7 : 1 }}
          >
            {portalLoading ? 'Opening portal…' : 'Manage Subscription'}
          </button>
        ) : (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
              Upgrade to Pro to unlock AI insights, deal simulator, and full margin analytics.
            </p>
            <button
              className="btn btn-primary"
              onClick={handleUpgrade}
              disabled={upgradeLoading}
              style={{ opacity: upgradeLoading ? 0.7 : 1 }}
            >
              {upgradeLoading ? 'Redirecting…' : 'Upgrade to Pro — $79/mo'}
            </button>
          </div>
        )}
      </Section>

      {/* Connected Stores */}
      <Section title="Connected Stores">
        {stores.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No stores connected.</p>
        ) : (
          stores.map((s) => {
            const name = s.shopName || s.shopDomain.replace('.myshopify.com', '').replace(/-/g, ' ')
            return (
              <div key={s.shopDomain} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 550 }}>{name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.shopDomain}</div>
                </div>
                {s.lastProductsSyncAt && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Synced {new Date(s.lastProductsSyncAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )
          })
        )}
      </Section>
    </div>
  )
}
