import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../App.jsx';
import {
  Button, Alert, StatusBadge, Table, EmptyState, FilterChips,
  SearchInput, PageHeader, Tabs, formatCurrency, formatPercent,
  marginColor, marginStatus, MarginBar, Skeleton, Badge, Card
} from '../components/UI.jsx';
import COGSImportModal from '../components/COGSImportModal.jsx';
import AlertsTab from '../components/AlertsTab.jsx';

/* ─── Helpers ─── */
const ANALYSIS_KEY = 'mp_ai_analysis';

function loadSavedAnalyses() {
  try { return JSON.parse(localStorage.getItem(ANALYSIS_KEY) || '{}'); } catch { return {}; }
}

function saveAnalysis(variantId, text) {
  const all = loadSavedAnalyses();
  all[variantId] = { text, savedAt: Date.now() };
  localStorage.setItem(ANALYSIS_KEY, JSON.stringify(all));
}

function timeAgo(ts) {
  if (!ts) return null;
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─── Cost Edit Modal ─── */
function CostEditModal({ product, onSave, onClose }) {
  const [cost, setCost] = useState(product.cost != null ? String(product.cost) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const targetCost60 = product.price ? (product.price * 0.4).toFixed(2) : null;
  const previewMargin = cost && product.price > 0
    ? (((product.price - parseFloat(cost)) / product.price) * 100).toFixed(1)
    : null;

  const handleSave = async () => {
    const num = parseFloat(cost);
    if (isNaN(num) || num < 0) { setError('Enter a valid cost.'); return; }
    if (num >= product.price) { setError(`Cost can't be ≥ price (${formatCurrency(product.price)}).`); return; }
    setSaving(true);
    try {
      await onSave(num);
      onClose();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const mc = previewMargin != null ? marginColor(parseFloat(previewMargin)) : null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(26,20,10,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24, animation: 'fadeIn 0.15s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 380, boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.2s ease' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="font-display" style={{ fontSize: '15px', fontWeight: 700 }}>Set cost</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.productTitle}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, padding: '0 2px' }}>×</button>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && <div style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--red-bg)', border: '1px solid var(--red-border)', fontSize: '13px', color: 'var(--red)' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 2 }}>Current price</div>
              <div className="mono" style={{ fontSize: '15px', fontWeight: 600 }}>{formatCurrency(product.price)}</div>
            </div>
            {targetCost60 && (
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 12 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 2 }}>Max cost for 60% margin</div>
                <div className="mono" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--green)' }}>{formatCurrency(parseFloat(targetCost60))}</div>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
              Cost of goods (COGS)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>$</span>
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={cost}
                onChange={e => { setCost(e.target.value); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
                placeholder="0.00"
                style={{ width: '100%', padding: '9px 12px 9px 24px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '15px', fontFamily: "'JetBrains Mono', monospace", outline: 'none', transition: 'var(--transition)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-subtle)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {previewMargin != null && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: mc === 'var(--green)' ? 'var(--green-bg)' : mc === 'var(--yellow)' ? 'var(--yellow-bg)' : 'var(--red-bg)', border: `1px solid ${mc === 'var(--green)' ? 'var(--green-border)' : mc === 'var(--yellow)' ? 'var(--yellow-border)' : 'var(--red-border)'}` }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Margin at this cost: </span>
              <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: mc }}>{previewMargin}%</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button variant="secondary" size="md" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
            <Button size="md" loading={saving} onClick={handleSave} style={{ flex: 1 }}>Save cost</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── AI Analysis Accordion ─── */
function AIAnalysisRow({ variantId, productTitle, isPro, analyses, onAnalyzed }) {
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
function ProductDetailPanel({ product }) {
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
      setCostLog(d.log || d || []);
    } catch { setCostLog([]); }
    finally { setCostLogLoading(false); }
  };

  // SVG chart
  const chartWidth = 400;
  const chartHeight = 80;
  const validSnaps = snapshots.filter(s => s.marginPercent != null);
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

/* ─── Products Tab ─── */
function ProductsTab({ products, loading, onCostSaved, saving, isPro }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [costModal, setCostModal] = useState(null);
  const [expandedAI, setExpandedAI] = useState({});
  const [expandedDetail, setExpandedDetail] = useState({});
  const [analyses, setAnalyses] = useState(loadSavedAnalyses);

  const handleAnalyzed = (variantId, text) => {
    setAnalyses(prev => ({ ...prev, [variantId]: { text, savedAt: Date.now() } }));
  };

  const counts = {
    all: products.length,
    healthy: products.filter(p => p.marginPercent >= 60).length,
    low: products.filter(p => p.marginPercent >= 40 && p.marginPercent < 60).length,
    losing: products.filter(p => p.marginPercent != null && p.marginPercent < 40).length,
    missing: products.filter(p => p.cost == null).length,
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.productTitle?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    const matchFilter =
      filter === 'all' ? true :
      filter === 'healthy' ? p.marginPercent >= 60 :
      filter === 'low' ? (p.marginPercent >= 40 && p.marginPercent < 60) :
      filter === 'losing' ? (p.marginPercent != null && p.marginPercent < 40) :
      filter === 'missing' ? p.cost == null : true;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search products or SKU…" />
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { label: 'All', value: 'all', count: counts.all },
            { label: 'Healthy', value: 'healthy', count: counts.healthy },
            { label: 'Low margin', value: 'low', count: counts.low },
            { label: 'Losing', value: 'losing', count: counts.losing },
            { label: 'No cost', value: 'missing', count: counts.missing },
          ]}
        />
      </div>

      {loading ? (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface)' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ padding: '14px 16px', borderBottom: i < 5 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', gap: 16, alignItems: 'center' }}>
              <Skeleton height={12} width="28%" />
              <Skeleton height={12} width="12%" />
              <Skeleton height={12} width="12%" />
              <Skeleton height={12} width="12%" />
              <Skeleton height={12} width="20%" />
              <Skeleton height={12} width="10%" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📦" title={search || filter !== 'all' ? 'No matching products' : 'No products yet'} description={search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Sync your store to import products.'} />
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface)' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1.5fr 1fr 120px', gap: 0, padding: '8px 16px', background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
            {['Product', 'SKU', 'Price', 'Cost', 'Margin', 'Status', ''].map(h => (
              <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>
          {filtered.map((p, i) => {
            const isExpanded = expandedAI[p.id];
            const isDetailExpanded = expandedDetail[p.id];
            return (
              <div key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1.5fr 1fr 120px', gap: 0, padding: '11px 16px', transition: 'background 0.15s ease', cursor: 'default', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  {/* Product name — click to expand details */}
                  <div style={{ minWidth: 0 }}>
                    <button
                      onClick={() => setExpandedDetail(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      title="View margin trend and cost history"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}
                    >
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: isDetailExpanded ? 'var(--accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.productTitle}</div>
                    </button>
                    {p.variantTitle && p.variantTitle !== 'Default' && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{p.variantTitle}</div>}
                  </div>
                  {/* SKU */}
                  <div className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.sku || '—'}</div>
                  {/* Price */}
                  <div className="mono" style={{ fontSize: '13.5px', fontWeight: 500 }}>{formatCurrency(p.price)}</div>
                  {/* Cost — click to edit */}
                  <button
                    onClick={() => setCostModal(p)}
                    title="Click to edit cost"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 5, padding: '3px 6px', borderRadius: 5, transition: 'var(--transition)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="mono" style={{ fontSize: '13px', color: p.cost != null ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: '1px dashed var(--border)' }}>
                      {p.cost != null ? formatCurrency(p.cost) : 'Set cost'}
                    </span>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                      <path d="M1.5 9.5h2l5-5-2-2-5 5v2zM8 2l1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {/* Margin bar */}
                  <div>{p.cost != null ? <MarginBar pct={p.marginPercent} width={100} /> : <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>}</div>
                  {/* Status badge */}
                  <div>
                    <StatusBadge variant={p.cost == null ? 'missing_cost' : marginStatus(p.marginPercent)} />
                  </div>
                  {/* AI toggle + Details */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                    <button
                      onClick={() => setExpandedAI(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      title="AI Analysis"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 8px', borderRadius: 5, fontSize: '11.5px', fontWeight: 600,
                        background: isExpanded ? 'var(--accent-subtle)' : 'transparent',
                        border: isExpanded ? '1px solid var(--accent-border)' : '1px solid transparent',
                        color: isExpanded ? 'var(--accent)' : analyses[p.id] ? 'var(--green)' : 'var(--text-muted)',
                        cursor: 'pointer', transition: 'var(--transition)',
                      }}
                      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1.5l.8 1.7 1.9.3-1.4 1.3.3 1.9L6 5.8l-1.6.9.3-1.9L3.3 3.5l1.9-.3L6 1.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
                        <path d="M2 10l1.2-.6M10 10l-1.2-.6M6 9v1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                      </svg>
                      AI
                    </button>
                  </div>
                </div>
                {/* Detail panel (margin trend / cost history) */}
                {isDetailExpanded && <ProductDetailPanel product={p} />}
                {/* AI analysis row */}
                {isExpanded && (
                  <AIAnalysisRow
                    variantId={p.id}
                    productTitle={p.productTitle}
                    isPro={isPro}
                    analyses={analyses}
                    onAnalyzed={handleAnalyzed}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ marginTop: 8, fontSize: '12px', color: 'var(--text-muted)' }}>
          {filtered.length} of {products.length} products · Click product name to view trend · Click cost to edit · Click AI to analyze
        </div>
      )}

      {costModal && (
        <CostEditModal
          product={costModal}
          onSave={async (cost) => {
            await onCostSaved(costModal.id, cost);
          }}
          onClose={() => setCostModal(null)}
        />
      )}
    </div>
  );
}

/* ─── Recommendations Tab ─── */
function RecommendationsTab({ products, loading, isPro }) {
  const [recs, setRecs] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [applying, setApplying] = useState({});
  const [undoing, setUndoing] = useState({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const savedAnalyses = loadSavedAnalyses();

  useEffect(() => {
    const load = async () => {
      setRecsLoading(true);
      try {
        const data = await api.get('/api/recommendations');
        setRecs(data.recommendations || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setRecsLoading(false);
      }
    };
    load();
  }, []);

  const handleApply = async (variantId, price) => {
    setApplying(s => ({ ...s, [variantId]: true }));
    try {
      await api.post('/api/prices/apply', { variantId, price });
      setRecs(prev => prev.map(r => r.variantId === variantId ? { ...r, applied: true } : r));
      setSuccessMsg('Price applied.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) { setError(e.message); }
    finally { setApplying(s => ({ ...s, [variantId]: false })); }
  };

  const handleUndo = async (variantId) => {
    setUndoing(s => ({ ...s, [variantId]: true }));
    try {
      await api.post(`/api/prices/undo/${variantId}`);
      setRecs(prev => prev.map(r => r.variantId === variantId ? { ...r, applied: false } : r));
      setSuccessMsg('Price restored.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) { setError(e.message); }
    finally { setUndoing(s => ({ ...s, [variantId]: false })); }
  };

  const handleApplyAll = async () => {
    setBulkLoading(true);
    try {
      await api.post('/api/prices/apply-all');
      setRecs(prev => prev.map(r => ({ ...r, applied: true })));
      setSuccessMsg(`Applied all price changes.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) { setError(e.message); }
    finally { setBulkLoading(false); }
  };

  const pending = recs.filter(r => !r.applied && r.suggestedPrice);

  return (
    <div>
      {(error || successMsg) && (
        <div style={{ marginBottom: 14 }}>
          {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
          {successMsg && <Alert type="success" message={successMsg} />}
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            <span className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{pending.length}</span> product{pending.length !== 1 ? 's' : ''} need pricing attention
          </span>
          <Button size="sm" loading={bulkLoading} onClick={handleApplyAll}>Apply all {pending.length}</Button>
        </div>
      )}

      {recsLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} height={80} style={{ borderRadius: 10 }} />)}
        </div>
      ) : recs.length === 0 ? (
        <EmptyState icon="✓" title="All products are optimally priced" description="Every product is hitting the 60% margin target." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recs.map(rec => {
            const hasAI = !!savedAnalyses[rec.variantId];
            const isUnusual = rec.unusualCost;
            return (
              <div
                key={rec.variantId}
                style={{ background: 'var(--surface)', border: `1px solid ${isUnusual ? 'var(--yellow-border)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-sm)' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.productTitle}</span>
                    {isUnusual && <Badge color="yellow">Unusual cost</Badge>}
                    {hasAI && <Badge color="accent">AI analyzed</Badge>}
                  </div>
                  {rec.sku && rec.sku !== 'Default' && <div className="mono" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{rec.sku}</div>}
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>{rec.recommendation}</div>
                </div>

                {rec.suggestedPrice && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: 1 }}>Now</div>
                      <div className="mono" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: rec.applied ? 'line-through' : 'none', opacity: rec.applied ? 0.6 : 1 }}>{formatCurrency(rec.currentPrice)}</div>
                      <div style={{ fontSize: '11px', color: marginColor(rec.currentMargin) }}>{rec.currentMargin != null ? formatPercent(rec.currentMargin) : 'No cost'}</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: 1 }}>Suggested</div>
                      <div className="mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(rec.suggestedPrice)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--green)' }}>~60% margin</div>
                    </div>
                  </div>
                )}

                <div style={{ flexShrink: 0 }}>
                  {rec.status === 'missing_cost' ? (
                    <Badge color="neutral">Set cost first</Badge>
                  ) : rec.applied ? (
                    <Button variant="secondary" size="sm" loading={undoing[rec.variantId]} onClick={() => handleUndo(rec.variantId)}>Undo</Button>
                  ) : rec.suggestedPrice ? (
                    <Button size="sm" loading={applying[rec.variantId]} onClick={() => handleApply(rec.variantId, rec.suggestedPrice)}>Apply</Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── CSV Export ─── */
function exportProductsCSV(products) {
  const header = 'Product,SKU,Price,COGS,Margin %,Units Sold 30d,Revenue 30d';
  const rows = products.map(p => [
    `"${(p.productTitle || '').replace(/"/g, '""')}"`,
    p.sku || '',
    p.price != null ? p.price.toFixed(2) : '',
    p.cost != null ? p.cost.toFixed(2) : '',
    p.marginPercent != null ? p.marginPercent.toFixed(1) : '',
    p.unitsSold30d ?? '',
    p.revenue30d != null ? p.revenue30d.toFixed(2) : '',
  ].join(','));
  const csv = [header, ...rows].join('\n');
  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `margin-pilot-products-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Main ─── */
export default function ProductsPage() {
  const { user, sync, syncing } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState({});
  const [cogsModalOpen, setCogsModalOpen] = useState(false);
  const isPro = user?.plan === 'pro';

  const tabFromUrl = searchParams.get('tab') || 'products';
  const [tab, setTab] = useState(tabFromUrl === 'recommendations' ? 'recommendations' : 'products');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/products');
      setProducts(data.products || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCostSaved = async (variantId, cost) => {
    await api.put(`/api/products/${variantId}/cost`, { cogs: cost });
    setProducts(prev => prev.map(p => {
      if (p.id !== variantId) return p;
      const marginPercent = p.price > 0 ? ((p.price - cost) / p.price) * 100 : null;
      return { ...p, cost, marginPercent, status: marginStatus(marginPercent) };
    }));
  };

  const handleSyncAndReload = async () => {
    await sync();
    await load();
  };

  const missingCost = products.filter(p => p.cost == null).length;
  const recsCount = products.filter(p => p.cost != null && p.marginPercent < 60).length;

  return (
    <div className="page-content">
      <PageHeader
        title="Products"
        subtitle="Manage costs, track margins, and optimize prices"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => exportProductsCSV(products)}>
              Export CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setCogsModalOpen(true)}>
              Import COGS
            </Button>
            <Button variant="secondary" size="sm" loading={syncing} onClick={handleSyncAndReload}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M11.5 2.5A5.5 5.5 0 0 0 1 6.5M1.5 10.5A5.5 5.5 0 0 0 12 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M11 0.5v2.5H8.5M2 12.5v-2.5H4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sync
            </Button>
          </div>
        }
      />

      {error && <div style={{ marginBottom: 14 }}><Alert type="error" message={error} onDismiss={() => setError('')} /></div>}

      <Tabs
        tabs={[
          { id: 'products', label: 'Products', count: products.length },
          { id: 'recommendations', label: 'Recommendations', count: recsCount || undefined },
          { id: 'alerts', label: 'Alerts' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'products' && (
        <ProductsTab
          products={products}
          loading={loading}
          onCostSaved={handleCostSaved}
          saving={saving}
          isPro={isPro}
        />
      )}
      {tab === 'recommendations' && (
        <RecommendationsTab products={products} loading={loading} isPro={isPro} />
      )}
      {tab === 'alerts' && (
        <AlertsTab products={products} />
      )}

      <COGSImportModal
        isOpen={cogsModalOpen}
        onClose={() => setCogsModalOpen(false)}
        onImported={load}
      />
    </div>
  );
}
