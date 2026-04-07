import { useState } from 'react'
import { api } from '../api'

const PLATFORMS = [
  {
    id: 'shopify',
    name: 'Shopify',
    supported: true,
    desc: 'Connect via OAuth — secure & instant',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <path d="M22.1 6.3c-.1-.1-.2-.1-.4-.1-.1 0-2.2-.2-2.2-.2s-1.5-1.5-1.6-1.6c-.2-.2-.5-.1-.6-.1L16 5c-.3-.8-.7-1.5-1.3-2C14 2.3 13.1 2 12.1 2c-.1 0-.2 0-.4.1C11.5 1.8 11 1.7 10.6 2 8.2 2.5 7 5.6 6.5 7.2l-2.7.8c-.8.3-.8.3-.9 1L2 23.4l13.8 2.6 7.5-1.6C23.3 24.4 25 8 25 7.8c0-.7-.7-1.4-2.9-1.5z" fill="#96BF48"/>
      </svg>
    ),
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    supported: false,
    desc: 'Coming soon',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="6" fill="#7F54B3" opacity="0.2"/>
        <text x="14" y="19" textAnchor="middle" fontSize="10" fill="#7F54B3" fontWeight="700" fontFamily="system-ui">Woo</text>
      </svg>
    ),
  },
  {
    id: 'amazon',
    name: 'Amazon',
    supported: false,
    desc: 'Coming soon',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="6" fill="#FF9900" opacity="0.2"/>
        <text x="14" y="20" textAnchor="middle" fontSize="18" fill="#FF9900" fontFamily="Georgia,serif" fontWeight="700">a</text>
      </svg>
    ),
  },
  {
    id: 'etsy',
    name: 'Etsy',
    supported: false,
    desc: 'Coming soon',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="6" fill="#F56400" opacity="0.2"/>
        <text x="14" y="19" textAnchor="middle" fontSize="10" fill="#F56400" fontWeight="700" fontFamily="system-ui">etsy</text>
      </svg>
    ),
  },
]

const STEPS = ['account', 'platforms', 'connect', 'done']
const STEP_LABELS = ['Account', 'Platforms', 'Connect', 'Done']

const c = {
  bg: '#0a0e1a',
  surface: '#111827',
  surface2: '#1a2235',
  surface3: '#1f2d45',
  border: 'rgba(255,255,255,0.07)',
  text: '#e8eaf0',
  muted: '#6b7a99',
  accent: '#3b82f6',
  red: '#ef4444',
}

function Label({ children }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 600, color: c.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
      {children}
    </div>
  )
}

function Btn({ onClick, primary, disabled, children, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '11px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
      fontFamily: 'inherit', cursor: disabled ? 'not-allowed' : 'pointer',
      border: primary ? 'none' : `1px solid ${c.border}`,
      background: primary ? (disabled ? c.surface2 : c.accent) : 'transparent',
      color: primary ? (disabled ? c.muted : '#fff') : c.muted,
      transition: 'all 0.2s', ...style,
    }}>
      {children}
    </button>
  )
}

function StepIndicator({ current }) {
  const idx = STEPS.indexOf(current)
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2.25rem' }}>
      {STEP_LABELS.map((label, i) => {
        const done = i < idx
        const active = i === idx
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_LABELS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: done || active ? c.accent : c.surface2,
                border: `1.5px solid ${done || active ? c.accent : c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
              }}>
                {done
                  ? <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <span style={{ fontSize: '10px', fontWeight: 700, color: active ? '#fff' : c.muted }}>{i + 1}</span>
                }
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: active ? c.text : c.muted, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ flex: 1, height: '1.5px', margin: '0 6px', marginBottom: '20px', background: done ? c.accent : c.border, transition: 'background 0.3s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function AccountStep({ onNext, onSwitch }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused] = useState(null)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter a valid email address'
    if (form.password.length < 8) e.password = 'Must be at least 8 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

const handle = async () => {
  if (!validate()) return

  try {
    const user = await api.register({
      name: form.name,
      email: form.email,
      password: form.password,
    })

    onNext({ user }) // 👈 real user now
  } catch (err) {
    setErrors({ email: err.message || 'Failed to create account' })
  }
}

  const inputStyle = (key) => ({
    width: '100%', boxSizing: 'border-box',
    background: c.surface2, borderRadius: '8px',
    border: `1px solid ${errors[key] ? c.red : focused === key ? c.accent : c.border}`,
    padding: '10px 14px', fontSize: '14px', color: c.text,
    outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
  })

  return (
    <div>
      <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.35rem', fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>Create your account</h2>
      <p style={{ margin: '0 0 1.6rem', fontSize: '13px', color: c.muted, lineHeight: 1.6 }}>Start managing your store margins in minutes.</p>

      {[
        { key: 'name', label: 'Full name', type: 'text', ph: 'Jane Smith' },
        { key: 'email', label: 'Email address', type: 'email', ph: 'jane@yourstore.com' },
        { key: 'password', label: 'Password', type: 'password', ph: '8+ characters' },
        { key: 'confirm', label: 'Confirm password', type: 'password', ph: 'Re-enter password' },
      ].map(({ key, label, type, ph }) => (
        <div key={key} style={{ marginBottom: '1rem' }}>
          <Label>{label}</Label>
          <div style={{ position: 'relative' }}>
            <input
              type={key === 'password' || key === 'confirm' ? (showPass ? 'text' : 'password') : type}
              value={form[key]}
              placeholder={ph}
              onChange={e => set(key, e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handle()}
              onFocus={() => setFocused(key)}
              onBlur={() => setFocused(null)}
              style={{ ...inputStyle(key), paddingRight: key === 'password' ? '54px' : '14px' }}
            />
            {key === 'password' && (
              <button onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.muted, fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'inherit' }}>
                {showPass ? 'Hide' : 'Show'}
              </button>
            )}
          </div>
          {errors[key] && <p style={{ margin: '4px 0 0', fontSize: '12px', color: c.red }}>{errors[key]}</p>}
        </div>
      ))}

      <Btn primary onClick={handle} style={{ width: '100%', marginTop: '0.5rem' }}>Continue →</Btn>
      <p style={{ textAlign: 'center', marginTop: '1.1rem', fontSize: '13px', color: c.muted }}>
  Already have an account?{' '}
  <button
    onClick={onSwitch}
    style={{
      background: 'none',
      border: 'none',
      color: c.accent,
      cursor: 'pointer',
      fontWeight: 500
    }}
  >
    Sign in
  </button>
</p>
    </div>
  )
}

function PlatformStep({ onNext, onBack }) {
  const [selected, setSelected] = useState([])

  const toggle = (id, supported) => {
    if (!supported) return
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.35rem', fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>Where do you sell?</h2>
      <p style={{ margin: '0 0 1.6rem', fontSize: '13px', color: c.muted, lineHeight: 1.6 }}>Select all the platforms you sell on. You can add more later.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.6rem' }}>
        {PLATFORMS.map(p => {
          const sel = selected.includes(p.id)
          return (
            <button key={p.id} onClick={() => toggle(p.id, p.supported)} style={{
              background: sel ? 'rgba(59,130,246,0.08)' : c.surface2,
              border: `1px solid ${sel ? c.accent : c.border}`,
              borderRadius: '10px', padding: '14px 12px', textAlign: 'left',
              cursor: p.supported ? 'pointer' : 'not-allowed',
              opacity: p.supported ? 1 : 0.38,
              transition: 'all 0.2s', position: 'relative',
            }}>
              {sel && (
                <div style={{ position: 'absolute', top: '9px', right: '9px', width: '16px', height: '16px', borderRadius: '50%', background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
              <div style={{ marginBottom: '8px' }}>{p.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '3px' }}>{p.name}</div>
              <div style={{ fontSize: '11px', color: c.muted, fontStyle: !p.supported ? 'italic' : 'normal' }}>{p.desc}</div>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <Btn onClick={onBack} style={{ flex: 1 }}>← Back</Btn>
        <Btn primary onClick={() => selected.length > 0 && onNext({ platforms: selected })} disabled={selected.length === 0} style={{ flex: 2 }}>
          Continue →
        </Btn>
      </div>
      {selected.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: c.muted }}>Select at least one platform to continue</p>
      )}
    </div>
  )
}

function ConnectStep({ platforms, onNext, onBack }) {
  const [shopInput, setShopInput] = useState('')
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  const handleConnect = () => {
    const raw = shopInput.trim().toLowerCase().replace(/\.myshopify\.com$/, '')
    if (!raw) { setError('Please enter your store name'); return }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(raw)) { setError('Only letters, numbers, and dashes'); return }
    window.location.href = `/auth?shop=${encodeURIComponent(raw + '.myshopify.com')}`
  }

  const platformNames = platforms.length > 0
    ? platforms.map(id => PLATFORMS.find(p => p.id === id)?.name).join(' & ')
    : 'Shopify'

  return (
    <div>
      <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.35rem', fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>Link your stores</h2>
      <p style={{ margin: '0 0 1.6rem', fontSize: '13px', color: c.muted, lineHeight: 1.6 }}>
        Let's connect your {platformNames} {platforms.length <= 1 ? 'store' : 'stores'} so we can start tracking your margins.
      </p>

      {(platforms.includes('shopify') || platforms.length === 0) && (
        <div style={{ background: c.surface2, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '18px', marginBottom: '1rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' }}>
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <path d="M22.1 6.3c-.1-.1-.2-.1-.4-.1-.1 0-2.2-.2-2.2-.2s-1.5-1.5-1.6-1.6c-.2-.2-.5-.1-.6-.1L16 5c-.3-.8-.7-1.5-1.3-2C14 2.3 13.1 2 12.1 2c-.1 0-.2 0-.4.1C11.5 1.8 11 1.7 10.6 2 8.2 2.5 7 5.6 6.5 7.2l-2.7.8c-.8.3-.8.3-.9 1L2 23.4l13.8 2.6 7.5-1.6C23.3 24.4 25 8 25 7.8c0-.7-.7-1.4-2.9-1.5z" fill="#96BF48"/>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 600, color: c.text }}>Shopify</span>
            <span style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 8px', background: 'rgba(150,191,72,0.1)', color: '#96BF48', borderRadius: '20px', fontWeight: 700, letterSpacing: '0.06em' }}>OAUTH</span>
          </div>

          <p style={{ fontSize: '12px', color: c.muted, margin: '0 0 12px', lineHeight: 1.7 }}>
            Enter just your store name — the part before{' '}
            <code style={{ background: c.surface3, padding: '1px 6px', borderRadius: '4px', fontSize: '11px', color: '#96BF48', fontFamily: 'monospace' }}>.myshopify.com</code>.
            We'll redirect you to Shopify to authorize.
          </p>

          <Label>Store name</Label>
          <div style={{ display: 'flex' }}>
            <input
              type="text"
              value={shopInput}
              placeholder="my-store-name"
              onChange={e => { setShopInput(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={{
                flex: 1, background: c.surface3, outline: 'none', fontFamily: 'monospace',
                border: `1px solid ${error ? c.red : focused ? c.accent : c.border}`,
                borderRight: 'none', borderRadius: '8px 0 0 8px',
                padding: '9px 12px', fontSize: '13px', color: c.text,
              }}
            />
            <div style={{ background: c.surface3, border: `1px solid ${error ? c.red : focused ? c.accent : c.border}`, borderLeft: 'none', borderRadius: '0 8px 8px 0', padding: '9px 12px', fontSize: '12px', color: c.muted, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
              .myshopify.com
            </div>
          </div>
          {error && <p style={{ margin: '5px 0 0', fontSize: '12px', color: c.red }}>{error}</p>}

          <button onClick={handleConnect} style={{ width: '100%', marginTop: '12px', padding: '11px', background: c.accent, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
            Connect with Shopify →
          </button>
          <p style={{ fontSize: '11px', color: c.muted, textAlign: 'center', marginTop: '9px', marginBottom: 0, lineHeight: 1.6 }}>
            Read/write access to products, orders & inventory only. Revoke anytime from Shopify.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
        <Btn onClick={onBack} style={{ flex: 1 }}>← Back</Btn>
        <Btn onClick={() => onNext({})} style={{ flex: 2 }}>Skip for now</Btn>
      </div>
    </div>
  )
}

function DoneStep({ userData, onComplete }) {
  const firstName = userData?.user?.name?.trim().split(' ')[0] || ''
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', border: `2px solid ${c.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.4rem' }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4.5 11l4.5 4.5 8.5-9" stroke={c.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.35rem', fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>
        {firstName ? `Welcome, ${firstName}!` : "You're all set!"}
      </h2>
      <p style={{ fontSize: '13px', color: c.muted, margin: '0 0 1.6rem', lineHeight: 1.7 }}>
        Your store is syncing in the background. Head to the dashboard to see your profitability analysis.
      </p>

      <div style={{ textAlign: 'left', borderTop: `1px solid ${c.border}` }}>
        {[
          { label: 'Products synced', sub: 'All variants and pricing pulled in', dot: '#3b82f6' },
          { label: 'Orders synced', sub: 'Last 90 days of sales loaded', dot: '#22c55e' },
          { label: 'Margin analysis ready', sub: 'AI insights available on dashboard', dot: '#f59e0b' },
        ].map(({ label, sub, dot }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', borderBottom: `1px solid ${c.border}` }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: c.text }}>{label}</div>
              <div style={{ fontSize: '12px', color: c.muted }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onComplete} style={{ width: '100%', marginTop: '1.4rem', padding: '12px', background: c.accent, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
        Go to Dashboard →
      </button>
    </div>
  )
}

export default function OnboardingFlow({ initialStep = 'account', onSwitch, onComplete }) {
  const [step, setStep] = useState(initialStep)
  const [data, setData] = useState({})

  const go = (nextStep, newData = {}) => {
    setData(d => ({ ...d, ...newData }))
    setStep(nextStep)
  }

  return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 456 }}>

        {/* Brand — matches sidebar exactly */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <rect width="30" height="30" rx="7" fill={c.accent}/>
              <path d="M7 22l5-9 5 6 3-4 3 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '17px', fontWeight: 800, color: c.text, letterSpacing: '-0.02em', lineHeight: 1 }}>Margin Pilot</div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: c.muted, letterSpacing: '0.12em', marginTop: '3px' }}>PROFITABILITY ENGINE</div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '1.75rem 2rem' }}>
          <StepIndicator current={step} />

          {step === 'account' && (
            <AccountStep
              onNext={d => go('platforms', d)}
              onSwitch={onSwitch}
            />
          )}
          {step === 'platforms' && <PlatformStep onNext={d => go('connect', d)} onBack={() => setStep('account')} />}
          {step === 'connect'   && <ConnectStep  platforms={data.platforms || []} onNext={d => go('done', d)} onBack={() => setStep('platforms')} />}
          {step === 'done'      && <DoneStep userData={data} onComplete={() => onComplete && onComplete(data.user)} />}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.1rem', fontSize: '11px', color: c.muted, lineHeight: 1.8 }}>
          By creating an account you agree to our{' '}
          <a href="/terms" target="_blank" rel="noreferrer" style={{ color: c.accent, textDecoration: 'none' }}>Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: c.accent, textDecoration: 'none' }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
