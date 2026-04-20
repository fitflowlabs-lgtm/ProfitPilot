import { useState, useEffect } from 'react';
import api from '../api.js';
import { Button, Badge, Alert, EmptyState, Skeleton, formatCurrency, formatPercent, marginColor } from './UI.jsx';
import { loadSavedAnalyses } from './ProductDetailComponents.jsx';

/* ─── Recommendations Tab ─── */
export default function RecommendationsTab({ products, loading, isPro }) {
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
