import { useState, useEffect, useRef } from 'react'

export function StatusBadge({ status }) {
  const map = {
    good: { cls: 'badge-good', label: 'Good' },
    okay: { cls: 'badge-warn', label: 'Okay' },
    low: { cls: 'badge-bad', label: 'Low' },
    losing: { cls: 'badge-bad', label: 'Losing $' },
    missing_cost: { cls: 'badge-muted', label: 'No Cost' },
    urgent: { cls: 'badge-bad', label: 'Urgent' },
    soon: { cls: 'badge-warn', label: 'Reorder Soon' },
    overstock: { cls: 'badge-warn', label: 'Overstock' },
    no_data: { cls: 'badge-muted', label: 'No Data' },
    bad: { cls: 'badge-bad', label: 'Bad' },
    risky: { cls: 'badge-warn', label: 'Risky' },
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
    <div className={`metric-card ${color}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
}

export function Loading() {
  return (
    <div className="loading-center">
      <div className="loading-spinner" />
    </div>
  )
}

// Typewriter hook — types text out character by character
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

    // If same text, don't re-animate
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
    <div className="ai-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="ai-label">✦ {label}</div>
        {onClose && !loading && (
          <button className="ai-close-btn" onClick={onClose}>✕</button>
        )}
      </div>
      <div className="ai-text">
        {loading ? (
          <div className="ai-loading">
            <div className="ai-loading-dots">
              <span /><span /><span />
            </div>
            <span>Thinking…</span>
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
      className={`ai-analyze-btn ${isUrgent ? 'ai-analyze-btn--urgent' : ''}`}
      onClick={onClick}
      disabled={loading}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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
  if (val < 0) return 'var(--red)'
  if (val < 40) return 'var(--red)'
  if (val < 60) return 'var(--yellow)'
  return 'var(--green)'
}
