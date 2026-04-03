import { useState, useEffect, useCallback } from 'react'

const API = '/api/support'

function statusBadge(status) {
  const styles = {
    open: { background: 'var(--accent)', color: '#fff' },
    sent: { background: 'var(--green)', color: '#fff' },
    dismissed: { background: 'var(--surface-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' },
  }
  const s = styles[status] || styles.dismissed
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 999,
      fontSize: '0.72rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      ...s,
    }}>
      {status}
    </span>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function SupportPage({ isAdmin }) {
  if (!isAdmin) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Access Denied</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [actionMsg, setActionMsg] = useState({}) // { [id]: { text, isError } }
  const [actionLoading, setActionLoading] = useState({}) // { [id]: bool }

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const res = await fetch(`${API}/tickets${params}`, { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load tickets')
      setTickets(data.tickets || [])
      // Seed draft state from fetched tickets
      setDrafts((prev) => {
        const next = { ...prev }
        for (const t of data.tickets || []) {
          if (!(t.id in next)) next[t.id] = t.aiDraft || ''
        }
        return next
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const setMsg = (id, text, isError = false) => {
    setActionMsg((prev) => ({ ...prev, [id]: { text, isError } }))
    setTimeout(() => setActionMsg((prev) => { const n = { ...prev }; delete n[id]; return n }), 4000)
  }

  const setLoadingFor = (id, val) => setActionLoading((prev) => ({ ...prev, [id]: val }))

  const handleSaveDraft = async (ticket) => {
    setLoadingFor(ticket.id, true)
    try {
      const res = await fetch(`${API}/${ticket.id}/draft`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: drafts[ticket.id] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save draft')
      setMsg(ticket.id, 'Draft saved.')
    } catch (e) {
      setMsg(ticket.id, e.message, true)
    } finally {
      setLoadingFor(ticket.id, false)
    }
  }

  const handleSend = async (ticket) => {
    if (!window.confirm(`Send this reply to ${ticket.senderEmail}?`)) return
    setLoadingFor(ticket.id, true)
    try {
      // Save draft first so we send the latest edited version
      await fetch(`${API}/${ticket.id}/draft`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: drafts[ticket.id] }),
      })
      const res = await fetch(`${API}/${ticket.id}/send`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setMsg(ticket.id, 'Reply sent successfully.')
      await fetchTickets()
    } catch (e) {
      setMsg(ticket.id, e.message, true)
    } finally {
      setLoadingFor(ticket.id, false)
    }
  }

  const handleRegenerate = async (ticket) => {
    setLoadingFor(ticket.id, true)
    setMsg(ticket.id, 'Regenerating AI draft...')
    try {
      const res = await fetch(`${API}/${ticket.id}/regenerate`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to regenerate')
      setDrafts((prev) => ({ ...prev, [ticket.id]: data.ticket?.aiDraft || '' }))
      setMsg(ticket.id, 'AI draft regenerated.')
    } catch (e) {
      setMsg(ticket.id, e.message, true)
    } finally {
      setLoadingFor(ticket.id, false)
    }
  }

  const handleDismiss = async (ticket) => {
    setLoadingFor(ticket.id, true)
    try {
      const res = await fetch(`${API}/${ticket.id}/dismiss`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to dismiss')
      setMsg(ticket.id, 'Ticket dismissed.')
      await fetchTickets()
    } catch (e) {
      setMsg(ticket.id, e.message, true)
    } finally {
      setLoadingFor(ticket.id, false)
    }
  }

  const filterTabs = ['all', 'open', 'sent', 'dismissed']

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Support Tickets
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Review and send AI-drafted replies to support emails.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => { setStatusFilter(tab); setExpandedId(null) }}
            style={{
              padding: '5px 14px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: statusFilter === tab ? 'var(--accent)' : 'var(--surface)',
              color: statusFilter === tab ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '10px 14px', marginBottom: 16, background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 8, color: 'var(--red)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-center" style={{ paddingTop: 60 }}>
          <div className="loading-spinner" />
        </div>
      ) : tickets.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No tickets found.
        </div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Sender</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => {
                const dimmed = ticket.status === 'sent' || ticket.status === 'dismissed'
                const isExpanded = expandedId === ticket.id
                const busy = actionLoading[ticket.id]
                const msg = actionMsg[ticket.id]

                return (
                  <>
                    <tr
                      key={ticket.id}
                      onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                      style={{
                        opacity: dimmed ? 0.5 : 1,
                        cursor: 'pointer',
                        background: isExpanded ? 'var(--surface-raised)' : undefined,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {ticket.senderName || ticket.senderEmail}
                        </div>
                        {ticket.senderName && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ticket.senderEmail}</div>
                        )}
                        {ticket.user && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            Plan: <span style={{ color: ticket.user.plan !== 'free' ? 'var(--green)' : 'var(--text-muted)' }}>{ticket.user.plan}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {ticket.subject || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No subject</span>}
                      </td>
                      <td>{statusBadge(ticket.status)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {formatDate(ticket.createdAt)}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${ticket.id}-expanded`}>
                        <td colSpan={4} style={{ padding: '16px 20px 20px', background: 'var(--surface-raised)', borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            {/* Original message */}
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                Original Message
                              </div>
                              <textarea
                                readOnly
                                value={ticket.body}
                                style={{
                                  width: '100%',
                                  minHeight: 160,
                                  background: 'var(--surface)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 8,
                                  padding: '10px 12px',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.82rem',
                                  lineHeight: 1.6,
                                  resize: 'vertical',
                                  fontFamily: 'var(--font-body)',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>

                            {/* AI Draft */}
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                AI Draft Reply
                              </div>
                              <textarea
                                value={drafts[ticket.id] ?? ticket.aiDraft ?? ''}
                                onChange={(e) => setDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                                style={{
                                  width: '100%',
                                  minHeight: 160,
                                  background: 'var(--surface)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 8,
                                  padding: '10px 12px',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.82rem',
                                  lineHeight: 1.6,
                                  resize: 'vertical',
                                  fontFamily: 'var(--font-body)',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleSend(ticket)}
                              disabled={busy || ticket.status === 'sent'}
                              style={{ fontSize: '0.82rem', opacity: busy ? 0.7 : 1 }}
                            >
                              {busy ? 'Working...' : 'Send Reply'}
                            </button>
                            <button
                              className="btn btn-ghost"
                              onClick={() => handleRegenerate(ticket)}
                              disabled={busy}
                              style={{ fontSize: '0.82rem', opacity: busy ? 0.7 : 1 }}
                            >
                              Regenerate
                            </button>
                            <button
                              className="btn btn-ghost"
                              onClick={() => handleSaveDraft(ticket)}
                              disabled={busy}
                              style={{ fontSize: '0.82rem', opacity: busy ? 0.7 : 1 }}
                            >
                              Save Draft
                            </button>
                            <button
                              onClick={() => handleDismiss(ticket)}
                              disabled={busy || ticket.status === 'dismissed'}
                              style={{
                                fontSize: '0.82rem',
                                background: 'none',
                                border: '1px solid var(--border)',
                                borderRadius: 6,
                                padding: '6px 14px',
                                color: 'var(--text-muted)',
                                cursor: busy || ticket.status === 'dismissed' ? 'not-allowed' : 'pointer',
                                opacity: busy || ticket.status === 'dismissed' ? 0.5 : 1,
                              }}
                            >
                              Dismiss
                            </button>

                            {msg && (
                              <span style={{
                                fontSize: '0.8rem',
                                color: msg.isError ? 'var(--red)' : 'var(--green)',
                                marginLeft: 4,
                              }}>
                                {msg.text}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
