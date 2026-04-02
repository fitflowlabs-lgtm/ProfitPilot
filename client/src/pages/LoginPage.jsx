import { useState } from 'react'
import { api } from '../api'

export default function LoginPage({ onSwitch, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e?.preventDefault()
    if (!email || !password) { setError('Please enter your email and password'); return }
    setError('')
    setLoading(true)
    try {
      const result = await api.login({ email, password })
      if (result?.authenticated) {
        onLogin(result)
      } else {
        // Credentials valid but no Shopify store linked yet — go to onboarding
        onSwitch()
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ width: 400 }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '28px' }}>
          <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
            <rect width="30" height="30" rx="7" fill="var(--accent)"/>
            <path d="M7 22l5-9 5 6 3-4 3 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>Margin Pilot</div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', marginTop: '3px' }}>PROFITABILITY ENGINE</div>
          </div>
        </div>

        <h1 style={{ fontSize: '1.25rem', marginBottom: '6px', textAlign: 'left' }}>Welcome back</h1>
        <p style={{ textAlign: 'left' }}>Sign in to your account to continue</p>

        <form onSubmit={handleLogin} style={{ marginTop: '8px' }}>
          <div style={{ marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Email address</div>
          <input
            type="email"
            placeholder="you@yourstore.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            style={{ marginBottom: '14px' }}
          />
          <div style={{ marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Password</div>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && (
            <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: '20px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <button
            onClick={onSwitch}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '13px', fontFamily: 'inherit', padding: 0 }}
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  )
}
