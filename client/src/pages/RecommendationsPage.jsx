import { useState, useEffect } from 'react';
import api from '../api.js';
import { Button, Alert, Badge, EmptyState, Skeleton, PageHeader, formatCurrency, formatPercent, marginColor } from '../components/UI.jsx';

function RecommendationCard({ rec, onApply, onUndo, applying, undoing }) {
  const currentMarginColor = marginColor(rec.currentMargin);
  const suggestedMarginColor = marginColor(rec.suggestedMargin);
  const hasApplied = rec.applied;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: 'var(--shadow-sm)',
      transition: 'var(--transition)',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      {/* Product info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
          {rec.productTitle || rec.title}
        </div>
        {rec.variantTitle && rec.variantTitle !== 'Default Title' && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 6 }}>{rec.variantTitle}</div>
        )}
        {rec.sku && (
          <div className="mono" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{rec.sku}</div>
        )}
      </div>

      {/* Price arrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Current</div>
          <div className="mono" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: hasApplied ? 'line-through' : 'none', opacity: hasApplied ? 0.6 : 1 }}>
            {formatCurrency(rec.currentPrice)}
          </div>
          <div style={{ fontSize: '11.5px', color: currentMarginColor, fontWeight: 600 }}>{formatPercent(rec.currentMargin)}</div>
        </div>

        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--accent)', flexShrink: 0 }}>
          <path d="M3 9h12M11 5l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Suggested</div>
          <div className="mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>
            {formatCurrency(rec.suggestedPrice)}
          </div>
          <div style={{ fontSize: '11.5px', color: suggestedMarginColor, fontWeight: 600 }}>{formatPercent(rec.suggestedMargin)}</div>
        </div>
      </div>

      {/* Margin improvement */}
      <div style={{ flexShrink: 0, width: 100 }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 5 }}>Margin impact</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Badge color={rec.currentMargin < 0 ? 'red' : rec.currentMargin < 40 ? 'yellow' : 'neutral'}>
            {formatPercent(rec.currentMargin)}
          </Badge>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <Badge color="green">{formatPercent(rec.suggestedMargin)}</Badge>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        {hasApplied ? (
          <Button variant="secondary" size="sm" loading={undoing} onClick={() => onUndo(rec.variantId || rec.id)}>
            Undo
          </Button>
        ) : (
          <Button size="sm" loading={applying} onClick={() => onApply(rec.variantId || rec.id, rec.suggestedPrice)}>
            Apply price
          </Button>
        )}
      </div>
    </div>
  );
}

export default function RecommendationsPage({ embedded }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState({});
  const [undoing, setUndoing] = useState({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/recommendations');
      setRecs(data.recommendations || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApply = async (variantId, price) => {
    setApplying(s => ({ ...s, [variantId]: true }));
    try {
      await api.post('/api/prices/apply', { variantId, price });
      setRecs(prev => prev.map(r => (r.variantId || r.id) === variantId ? { ...r, applied: true } : r));
      setSuccessMsg('Price applied successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(s => ({ ...s, [variantId]: false }));
    }
  };

  const handleUndo = async (variantId) => {
    setUndoing(s => ({ ...s, [variantId]: true }));
    try {
      await api.post(`/api/prices/undo/${variantId}`);
      setRecs(prev => prev.map(r => (r.variantId || r.id) === variantId ? { ...r, applied: false } : r));
      setSuccessMsg('Price restored.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUndoing(s => ({ ...s, [variantId]: false }));
    }
  };

  const handleApplyAll = async () => {
    setBulkLoading(true);
    try {
      await api.post('/api/prices/apply-all');
      setRecs(prev => prev.map(r => ({ ...r, applied: true })));
      setSuccessMsg(`Applied ${recs.length} price changes.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const pending = recs.filter(r => !r.applied);

  return (
    <div className={embedded ? '' : 'page-content'}>
      {!embedded && (
        <PageHeader
          title="Recommendations"
          subtitle="Suggested price changes to hit your 60% margin target"
          actions={
            pending.length > 0 && (
              <Button loading={bulkLoading} onClick={handleApplyAll}>
                Apply all {pending.length} changes
              </Button>
            )
          }
        />
      )}

      {embedded && pending.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <Button loading={bulkLoading} onClick={handleApplyAll}>
            Apply all {pending.length} changes
          </Button>
        </div>
      )}

      {(error || successMsg) && (
        <div style={{ marginBottom: 16 }}>
          {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
          {successMsg && <Alert type="success" message={successMsg} />}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
              <Skeleton height={14} width="45%" style={{ marginBottom: 8 }} />
              <Skeleton height={10} width="25%" />
            </div>
          ))}
        </div>
      ) : recs.length === 0 ? (
        <EmptyState
          icon="✓"
          title="All products are optimally priced"
          description="Every product in your catalog is already hitting the 60% margin target. Nice work."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!embedded && (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 6 }}>
              <span className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pending.length}</span> product{pending.length !== 1 ? 's' : ''} need pricing attention
            </div>
          )}
          {recs.map(rec => (
            <RecommendationCard
              key={rec.variantId || rec.id}
              rec={rec}
              onApply={handleApply}
              onUndo={handleUndo}
              applying={applying[rec.variantId || rec.id]}
              undoing={undoing[rec.variantId || rec.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
