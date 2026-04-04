import { useEffect, useState } from 'react'
import { api } from '../api'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) {
      setStatus('error')
      setMessage('No verification token found. Please use the link from your email.')
      return
    }
    api.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'Verification failed. Please try again.')
      })
  }, [])

  const goHome = () => {
    window.history.replaceState({}, '', '/')
    window.location.reload()
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0e1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '2rem', maxWidth: 420, width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#e8eaf0', letterSpacing: '-0.02em' }}>
            Margin Pilot
          </span>
        </div>

        {status === 'loading' && (
          <>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#6b7a99', fontSize: '0.9rem' }}>Verifying your email…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(34,197,94,0.1)', border: '2px solid #22c55e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4.5 11l4.5 4.5 8.5-9" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e8eaf0', margin: '0 0 10px' }}>Email verified!</h2>
            <p style={{ color: '#6b7a99', fontSize: '0.875rem', margin: '0 0 24px', lineHeight: 1.6 }}>
              Your email address has been verified. You're all set.
            </p>
            <button
              onClick={goHome}
              style={{
                background: '#3b82f6', color: '#fff', border: 'none',
                borderRadius: 8, padding: '11px 24px', fontSize: '0.9rem',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%',
              }}
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)', border: '2px solid #ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M6 6l10 10M16 6L6 16" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e8eaf0', margin: '0 0 10px' }}>Verification failed</h2>
            <p style={{ color: '#6b7a99', fontSize: '0.875rem', margin: '0 0 24px', lineHeight: 1.6 }}>
              {message}
            </p>
            <button
              onClick={goHome}
              style={{
                background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6',
                borderRadius: 8, padding: '11px 24px', fontSize: '0.9rem',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%',
              }}
            >
              Back to app
            </button>
          </>
        )}
      </div>
    </div>
  )
}
