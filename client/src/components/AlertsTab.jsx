import { useState, useEffect } from 'react';
import api from '../api.js';
import { Button, Alert, Badge, Skeleton, formatPercent, marginColor } from './UI.jsx';

export default function AlertsTab({ products }) {
  const [alerts, setAlerts] = useState([]);
  const [firing, setFiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [newVariantId, setNewVariantId] = useState('');
  const [newThreshold, setNewThreshold] = useState('20');
  const [deleting, setDeleting] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [alertsData, checkData] = await Promise.all([
        api.get('/api/alerts'),
        api.get('/api/alerts/check'),
      ]);
      setAlerts(alertsData.alerts || []);
      setFiring(checkData.firing || []);
    } catch (e) {
      setError(e.message || 'Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newVariantId) { setError('Select a product.'); return; }
    const threshold = parseFloat(newThreshold);
    if (isNaN(threshold) || threshold < 0 || threshold > 100) { setError('Enter a valid threshold (0–100).'); return; }
    setAdding(true);
    setError('');
    try {
      await api.post('/api/alerts', { variantId: newVariantId, thresholdPct: threshold });
      setNewVariantId('');
      setNewThreshold('20');
      await load();
    } catch (e) {
      setError(e.message || 'Failed to add alert.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(d => ({ ...d, [id]: true }));
    try {
      await api.delete(`/api/alerts/${id}`);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      setError(e.message || 'Failed to delete alert.');
    } finally {
      setDeleting(d => ({ ...d, [id]: false }));
    }
  };

  const firingIds = new Set(firing.map(f => f.id || f.alertId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Firing alerts banner */}
      {firing.length > 0 && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius)', background: 'var(--red-bg)', border: '1px solid var(--red-border)' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            {firing.length} alert{firing.length !== 1 ? 's' : ''} firing
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {firing.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '13.5px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.productTitle || f.variantTitle || 'Unknown product'}</span>
                <span style={{ color: 'var(--red)', fontFamily: 'monospace', fontWeight: 700 }}>{formatPercent(f.currentMargin)}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>below {formatPercent(f.thresholdPct)} threshold</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}

      {/* Add alert form */}
      <form onSubmit={handleAdd} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Add margin alert</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Product / variant</label>
            <select
              value={newVariantId}
              onChange={e => setNewVariantId(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '13.5px', background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none' }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
            >
              <option value="">Select a product…</option>
              {(products || []).map(p => (
                <option key={p.id} value={p.id}>{p.productTitle}{p.variantTitle && p.variantTitle !== 'Default' ? ` · ${p.variantTitle}` : ''}</option>
              ))}
            </select>
          </div>
          <div style={{ width: 120 }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Threshold %</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={newThreshold}
                onChange={e => setNewThreshold(e.target.value)}
                style={{ width: '100%', padding: '8px 24px 8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '13.5px', background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
              />
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-muted)' }}>%</span>
            </div>
          </div>
          <Button type="submit" size="sm" loading={adding}>Add</Button>
        </div>
      </form>

      {/* Alerts list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} height={60} style={{ borderRadius: 8 }} />)}
        </div>
      ) : alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
          No alerts configured. Add one above to get notified when margins drop.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {alerts.map(alert => {
            const isFiring = firingIds.has(alert.id);
            const mc = marginColor(alert.currentMargin);
            return (
              <div
                key={alert.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${isFiring ? 'var(--red-border)' : 'var(--border)'}`,
                  background: isFiring ? 'var(--red-bg)' : 'var(--surface)',
                  transition: 'var(--transition)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {alert.productTitle || alert.variantTitle || `Variant ${alert.variantId}`}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                    Alert when below {formatPercent(alert.thresholdPct)}
                  </div>
                </div>

                {alert.currentMargin != null && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 1 }}>Current</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: mc }}>{formatPercent(alert.currentMargin)}</div>
                  </div>
                )}

                <Badge color={isFiring ? 'red' : 'green'}>{isFiring ? 'Firing' : 'Healthy'}</Badge>

                <button
                  onClick={() => handleDelete(alert.id)}
                  disabled={deleting[alert.id]}
                  title="Delete alert"
                  style={{ background: 'none', border: 'none', cursor: deleting[alert.id] ? 'not-allowed' : 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: '2px 4px', borderRadius: 4, opacity: deleting[alert.id] ? 0.5 : 1 }}
                  onMouseEnter={e => { if (!deleting[alert.id]) e.currentTarget.style.color = 'var(--red)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
