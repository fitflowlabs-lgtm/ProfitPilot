import { useState, useEffect, useRef } from 'react'

export function StatusBadge({ status }) {
  const map = {
    good:         { cls: 'badge-good',  label: 'Good'        },
    okay:         { cls: 'badge-warn',  label: 'Okay'        },
    low:          { cls: 'badge-bad',   label: 'Low'         },
    losing:       { cls: 'badge-bad',   label: 'Losing'      },
    missing_cost: { cls: 'badge-muted', label: 'No Cost'     },
    urgent:       { cls: 'badge-bad',   label: 'Urgent'      },
    soon:         { cls: 'badge-warn',  label: 'Reorder Soon'},
    overstock:    { cls: 'badge-warn',  label: 'Overstock'   },
    no_data:      { cls: 'badge-muted', label: 'No Data'     },
    bad:          { cls: 'badge-bad',   label: 'Bad'         },
    risky:        { cls: 'badge-warn',  label: 'Risky'       },
  }
  const { cls, label } = map[status] || { cls: 'badge-muted', label: status }
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {label}
    </span>
  )
}

export function MetricCard({ label, value, sub, color = 'accent' }) {
  return (
    <div className={`metric-card ${color} animate-in`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
}

export function Loading() {
  return (
    <div className="loading-center">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {/* Refined ring spinner */}
        <div style={{
          width: 28, height: 28,
          border: '1.5px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          Loading
        </span>
      </div>
    </div>
  )
}

/* Typewriter hook */
function useTypewriter(text, charsPerTick = 3, tickMs = 16) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const prevTextRef = useRef(null)

  useEffect(() => {
    if (!text) {
      setDisplayed('')
      setDone(false)
      prevTextRef.current = null
      return
    }
    if (text === prevTextRef.current) return
    prevTextRef.current = text
    setDisplayed('')
    setDone(false)
    let index = 0

    const interval = setInterval(() => {
      index += charsPerTick
      if (index >= text.length) {
        setDisplayed(text)
        setDone(true)
        clearInterval(interval)
      } else {
        setDisplayed(text.slice(0, index))
      }
    }, tickMs)

    return () => clearInterval(interval)
  }, [text, charsPerTick, tickMs])

  return { displayed, done }
}

export function AICard({ label, children, loading, onClose }) {
  const text = typeof children === 'string' ? children : null
  const { displayed, done } = useTypewriter(loading ? null : text)

  return (
    <div className="ai-card animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="ai-label">
          {/* Pulsing dot instead of emoji */}
          <span className="ai-label-dot" />
          {label}
        </div>
        {onClose && !loading && (
          <button className="ai-close-btn" onClick={onClose} aria-label="Dismiss">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      <div className="ai-text">
        {loading ? (
          <div className="ai-loading">
            <div className="ai-loading-dots">
              <span /><span /><span />
            </div>
            <span>Thinking</span>
          </div>
        ) : text ? (
          <>
            {displayed}
            {!done && <span className="ai-cursor" />}
          </>
        ) : children}
      </div>
    </div>
  )
}

export function AIButton({ onClick, loading, variant = 'default' }) {
  const isUrgent = variant === 'urgent'
  return (
    <button
      className={`ai-analyze-btn${isUrgent ? ' ai-analyze-btn--urgent' : ''}`}
      onClick={onClick}
      disabled={loading}
    >
      {/* Spark icon */}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      {loading ? 'Analyzing…' : 'Analyze'}
    </button>
  )
}

export function formatCurrency(val) {
  if (val == null) return '—'
  const n = Number(val)
  if (n < 0) return `−$${Math.abs(n).toFixed(2)}`
  return `$${n.toFixed(2)}`
}

export function formatPercent(val) {
  if (val == null) return '—'
  return `${Number(val).toFixed(1)}%`
}

export function marginColor(val) {
  if (val == null) return undefined
  if (val < 0)  return 'var(--red)'
  if (val < 40) return 'var(--red)'
  if (val < 60) return 'var(--yellow)'
  return 'var(--green)'
}
