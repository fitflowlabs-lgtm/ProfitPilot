import { useState, useEffect, useRef } from 'react';
import api from '../api.js';
import { Skeleton, formatCurrency, formatPercent, marginColor } from './UI.jsx';

/* ─── Helpers ─── */
const ANALYSIS_KEY = 'mp_ai_analysis';

export function loadSavedAnalyses() {
  try { return JSON.parse(localStorage.getItem(ANALYSIS_KEY) || '{}'); } catch { return {}; }
}

export function saveAnalysis(variantId, text) {
  const all = loadSavedAnalyses();
  all[variantId] = { text, savedAt: Date.now() };
  localStorage.setItem(ANALYSIS_KEY, JSON.stringify(all));
}

export function timeAgo(ts) {
  if (!ts) return null;
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─── AI Analysis Accordion ─── */
export function AIAnalysisRow({ variantId, productTitle, isPro, analyses, onAnalyzed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [displayed, setDisplayed] = useState('');
  const saved = analyses[variantId];
  const timerRef = useRef(null);

  const runAnalysis = async () => {
    if (!isPro) { window.location.href = '/pricing'; return; }
    setLoading(true);
    setError('');
    setDisplayed('');
    try {
      const data = await api.post(`/api/ai/product/${variantId}`);
      const text = data.analysis || data.text || '';
      saveAnalysis(variantId, text);
      onAnalyzed(variantId, text);
      typewrite(text);
    } catch (e) {
      setError(e.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const typewrite = (text) => {
    let i = 0;
    const tick = () => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
        timerRef.current = setTimeout(tick, 10);
      }
    };
    tick();
  };

  useEffect(() => {
    if (saved?.text && !displayed) {
      setDisplayed(saved.text);
    }
    return () => clearTimeout(timerRef.current);
  }, []);

  const textToShow = saved?.text || '';

  return (
    <div style={{ borderTop: '2px solid var(--accent-border)', background: 'linear-gradient(to right, rgba(26,92,56,0.04), transparent 60%)', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ padding: '16px 18px 16px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Left accent strip */}
        <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: 'var(--accent)', flexShrink: 0, opacity: 0.5 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1l.8 1.8 2 .3-1.4 1.4.3 2L5.5 5.6 4 6.5l.3-2L2.9 3.1l2-.3L5.5 1z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              AI Analysis
            </span>
            {saved?.savedAt && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 4 }}>
                · saved {timeAgo(saved.savedAt)}
              </span>
            )}
          </div>

          {error && <div style={{ fontSize: '13px', color: 'var(--red)', marginBottom: 10, padding: '7px 10px', background: 'var(--red-bg)', borderRadius: 6, border: '1px solid var(--red-border)' }}>{error}</div>}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {[1, 0.82, 0.68, 0.9, 0.55].map((w, i) => (
                <div key={i} style={{ height: 11, borderRadius: 4, background: 'linear-gradient(90deg, rgba(26,92,56,0.06) 0%, rgba(26,92,56,0.12) 50%, rgba(26,92,56,0.06) 100%)', backgroundSize: '400px 100%', animation: 'shimmer 1.4s ease-in-out infinite', width: `${w * 100}%` }} />
              ))}
            </div>
          )}

          {!loading && textToShow && (
            <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
              {displayed || textToShow}
              {displayed && displayed.length < textToShow.length && (
                <span style={{ display: 'inline-block', width: 2, height: 13, background: 'var(--accent)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />
              )}
            </div>
          )}

          {!loading && !textToShow && !error && (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
              {isPro
                ? 'Get an AI-powered breakdown of this product\'s profitability, suggested pricing, and cost reduction opportunities.'
                : 'Upgrade to Pro to unlock per-product AI analysis — pricing recommendations, profitability insights, and more.'}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isPro ? (
              <button
                onClick={runAnalysis}
                disabled={loading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 6, fontSize: '13px', fontWeight: 600,
                  background: loading ? 'var(--surface-raised)' : 'var(--accent)',
                  color: loading ? 'var(--text-muted)' : '#fff',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'var(--transition)', fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--accent-hover)'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--accent)'; }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1l.8 1.8 2 .3-1.4 1.4.3 2L6 5.6 4.3 6.5l.3-2L3.2 3.1l2-.3L6 1z" fill="currentColor" fillOpacity="0.9" />
                </svg>
                {loading ? 'Analyzing…' : textToShow ? 'Re-analyze' : 'Analyze this product'}
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/pricing'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, fontSize: '13px', fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'var(--transition)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Product Detail Panel (inline expand) ─── */
export function ProductDetailPanel({ product }) {
  const [detailTab, setDetailTab] = useState('trend');
  const [snapshots, setSnapshots] = useState([]);
  const [costLog, setCostLog] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [costLogLoading, setCostLogLoading] = useState(false);

  useEffect(() => {
    setTrendLoading(true);
    api.get(`/api/variants/${product.id}/snapshots`)
      .then(d => setSnapshots(d.snapshots || d || []))
      .catch(() => setSnapshots([]))
      .finally(() => setTrendLoading(false));
  }, [product.id]);

  const handleCostHistoryTab = async () => {
    setDetailTab('cost');
    if (costLog.length > 0) return;
    setCostLogLoading(true);
    try {
      const d = await api.get(`/api/variants/${product.id}/cost-log`);
      setCostLog(d.logs || []);
    } catch { setCostLog([]); }
    finally { setCostLogLoading(false); }
  };

  // SVG chart — VariantSnapshot has price+cogs, not marginPercent; compute it
  const chartWidth = 400;
  const chartHeight = 80;
  const validSnaps = snapshots
    .map(s => ({ ...s, marginPercent: s.cogs != null && s.price > 0 ? ((s.price - s.cogs) / s.price) * 100 : null }))
    .filter(s => s.marginPercent != null);
  const currentMargin = product.marginPercent;

  let change30d = null;
  if (validSnaps.length >= 2) {
    const oldest = validSnaps[0].marginPercent;
    const newest = validSnaps[validSnaps.length - 1].marginPercent;
    change30d = newest - oldest;
  }

  const points = validSnaps.map((s, i) => {
    const x = validSnaps.length > 1 ? (i / (validSnaps.length - 1)) * chartWidth : chartWidth / 2;
    const y = chartHeight - Math.max(0, Math.min(100, s.marginPercent)) / 100 * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-raised)', padding: '16px 18px', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[{ id: 'trend', label: 'Margin Trend' }, { id: 'cost', label: 'Cost History' }].map(t => {
          const isActive = detailTab === t.id;
          return (
            <button
              key={t.id}
              onClick={t.id === 'cost' ? handleCostHistoryTab : () => setDetailTab('trend')}
              style={{ padding: '7px 14px', fontSize: '13px', fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', background: 'none', border: 'none', borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', transition: 'var(--transition)', marginBottom: '-1px' }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {detailTab === 'trend' && (
        trendLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton height={80} />
            <Skeleton height={12} width="40%" />
          </div>
        ) : validSnaps.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No snapshot data available yet.</div>
        ) : (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 2 }}>Current margin</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: marginColor(currentMargin) }}>{formatPercent(currentMargin)}</div>
                </div>
                {change30d != null && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 2 }}>30d change</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: change30d >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {change30d >= 0 ? '↑' : '↓'} {Math.abs(change30d).toFixed(1)}pp
                    </div>
                  </div>
                )}
              </div>
              {/* SVG line chart */}
              <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" style={{ display: 'block', borderRadius: 6, background: 'var(--surface)' }}>
                {validSnaps.length > 1 && (
                  <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                )}
                {validSnaps.map((s, i) => {
                  const x = validSnaps.length > 1 ? (i / (validSnaps.length - 1)) * chartWidth : chartWidth / 2;
                  const y = chartHeight - Math.max(0, Math.min(100, s.marginPercent)) / 100 * chartHeight;
                  return <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)" />;
                })}
              </svg>
            </div>
            {/* Table */}
            <div style={{ flex: 1, minWidth: 220, maxHeight: 200, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Price</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Cost</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {validSnaps.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '5px 8px', color: 'var(--text-secondary)' }}>{s.date ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(s.price)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(s.cost)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: marginColor(s.marginPercent) }}>{formatPercent(s.marginPercent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {detailTab === 'cost' && (
        costLogLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} height={36} />)}
          </div>
        ) : costLog.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No cost history available.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {costLog.map((entry, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 7, background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: 80 }}>{entry.date ? new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{formatCurrency(entry.oldCost)}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>→</span>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(entry.newCost)}</span>
                {entry.marginImpact != null && (
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', color: entry.marginImpact >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600, marginLeft: 'auto' }}>
                    {entry.marginImpact >= 0 ? '+' : ''}{entry.marginImpact.toFixed(1)}pp
                  </span>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
