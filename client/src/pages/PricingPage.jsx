import { useState } from 'react'
import { api } from '../api'

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$29',
    period: '/month',
    description: 'For growing stores that need core margin insights.',
    features: [
      'Price recommendations',
      'Margin analytics',
      'Cost tracking',
      'Inventory overview',
      '1 Shopify store',
    ],
    cta: 'Get Basic',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$79',
    period: '/month',
    description: 'For serious operators who want every edge.',
    features: [
      'Everything in Basic',
      'AI pricing insights',
      'Deal simulator',
      'AI inventory analysis',
      'Priority support',
    ],
    cta: 'Get Pro',
    highlight: true,
  },
]

export default function PricingPage({ currentPlan = 'free' }) {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')

  const handleUpgrade = async (planId) => {
    setError('')
    setLoading(planId)
    try {
      const result = await api.createCheckoutSession(planId)
      if (result?.url) {
        window.location.href = result.url
      }
    } catch (e) {
      setError(e.message || 'Failed to start checkout. Please try again.')
    }
    setLoading(null)
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            Choose your plan
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Upgrade to unlock AI-powered pricing intelligence and advanced analytics.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: 24, padding: '12px 16px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 8, fontSize: '0.875rem', color: 'var(--red)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {PLANS.map((plan) => {
            const isActive = currentPlan === plan.id
            return (
              <div
                key={plan.id}
                style={{
                  background: plan.highlight ? 'var(--surface-raised)' : 'var(--surface)',
                  border: `1.5px solid ${plan.highlight ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 14,
                  padding: '28px 24px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--accent)', color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                    letterSpacing: '0.08em', padding: '3px 12px', borderRadius: 20,
                  }}>
                    MOST POPULAR
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 8 }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{plan.price}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{plan.period}</span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{plan.description}</p>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="7" fill="var(--accent)" fillOpacity="0.15"/>
                        <path d="M4 7l2 2 4-4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {isActive ? (
                  <div style={{ padding: '10px', textAlign: 'center', borderRadius: 8, background: 'var(--surface-raised)', border: '1px solid var(--border)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Current plan
                  </div>
                ) : (
                  <button
                    className={`btn ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading === plan.id}
                    style={{ width: '100%', opacity: loading === plan.id ? 0.7 : 1 }}
                  >
                    {loading === plan.id ? 'Redirecting…' : plan.cta}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Secure payments via Stripe. Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  )
}
