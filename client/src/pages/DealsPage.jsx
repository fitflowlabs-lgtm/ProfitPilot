import { useState, useEffect } from 'react';
import api from '../api.js';
import { useAuth } from '../App.jsx';
import { Button, Alert, Card, Badge, Skeleton, PageHeader, formatCurrency, formatPercent, marginColor } from '../components/UI.jsx';

function ResultPanel({ results, loading, isPro }) {
  if (loading) {
    return (
      <Card>
        <div className="font-display" style={{ fontSize: '15px', fontWeight: 700, marginBottom: 20 }}>Simulation Results</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i}>
              <Skeleton height={11} width="50%" style={{ marginBottom: 8 }} />
              <Skeleton height={22} width="65%" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 10 }}>
        <div style={{ opacity: 0.25, fontSize: 36 }}>→</div>
        <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 220 }}>
          Fill in the deal parameters and run the simulation to see projected impact.
        </div>
      </Card>
    );
  }

  const revenueSign = results.estimatedRevenueDelta >= 0;
  const profitSign = results.estimatedProfitDelta >= 0;

  return (
    <Card>
      <div className="font-display" style={{ fontSize: '15px', fontWeight: 700, marginBottom: 20 }}>Simulation Results</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ padding: '14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Revenue impact</div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: revenueSign ? 'var(--green)' : 'var(--red)' }}>
            {revenueSign ? '+' : ''}{formatCurrency(results.estimatedRevenueDelta)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 3 }}>
            {formatPercent(results.estimatedRevenuePct)} change
          </div>
        </div>

        <div style={{ padding: '14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Profit impact</div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: profitSign ? 'var(--green)' : 'var(--red)' }}>
            {profitSign ? '+' : ''}{formatCurrency(results.estimatedProfitDelta)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 3 }}>
            Margin: {formatPercent(results.blendedMargin)}
          </div>
        </div>
      </div>

      {/* Sales lift (AI/Pro) */}
      {results.salesLiftPrediction != null ? (
        <div style={{ padding: '14px', borderRadius: 10, border: '1px solid var(--accent-border)', background: 'var(--accent-subtle)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1.5l1 2.2 2.5.4-1.8 1.8.4 2.6L6.5 7.4l-2.1 1.1.4-2.6L3 4.1l2.5-.4 1-2.2z" stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Sales Lift Prediction</span>
          </div>
          <div className="mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
            +{formatPercent(results.salesLiftPrediction)}
          </div>
          {results.salesLiftReasoning && (
            <div style={{ fontSize: '12.5px', color: 'var(--accent)', opacity: 0.8 }}>{results.salesLiftReasoning}</div>
          )}
        </div>
      ) : isPro ? null : (
        <div style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--yellow-border)', background: 'var(--yellow-bg)', marginBottom: 16, fontSize: '13px', color: 'var(--yellow)', fontWeight: 500 }}>
          Upgrade to Pro for AI-powered sales lift predictions.
        </div>
      )}

      {/* Per-product breakdown */}
      {results.products && results.products.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Product breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.products.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 10px', borderRadius: 7, background: 'var(--surface-raised)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.productTitle}
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <span className="mono" style={{ fontSize: '12.5px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>{formatCurrency(p.originalPrice)}</span>
                  <span className="mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>{formatCurrency(p.dealPrice)}</span>
                  <Badge color={p.dealMargin >= 60 ? 'green' : p.dealMargin >= 40 ? 'yellow' : 'red'}>{formatPercent(p.dealMargin)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function DealsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [discount, setDiscount] = useState(15);
  const [duration, setDuration] = useState(7);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const isPro = user?.plan === 'pro';

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/api/products');
        const prods = data.variants || data.products || data || [];
        setProducts(prods);
        setSelected(prods.slice(0, Math.min(3, prods.length)).map(p => p.id));
      } catch {
        // fail silently
      } finally {
        setProductsLoading(false);
      }
    };
    load();
  }, []);

  const toggleProduct = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (selected.length === 0) { setError('Select at least one product.'); return; }
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const data = await api.post('/api/deals/simulate', {
        variantIds: selected,
        discountPercent: discount,
        durationDays: duration,
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <PageHeader
        title="Deals"
        subtitle="Simulate promotional pricing before applying discounts"
      />

      {error && (
        <div style={{ marginBottom: 16 }}>
          <Alert type="error" message={error} onDismiss={() => setError('')} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left: Form */}
        <Card>
          <form onSubmit={handleSimulate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="font-display" style={{ fontSize: '15px', fontWeight: 700 }}>Deal parameters</div>

            {/* Discount */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Discount %
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
                <span className="mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', minWidth: 44 }}>{discount}%</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Duration (days)
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[3, 7, 14, 30].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      border: `1px solid ${duration === d ? 'var(--accent)' : 'var(--border)'}`,
                      background: duration === d ? 'var(--accent-subtle)' : 'var(--surface)',
                      color: duration === d ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                    }}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {/* Products */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Products to include
              </label>
              {productsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[1, 2, 3].map(i => <Skeleton key={i} height={36} />)}
                </div>
              ) : products.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  No products available. Sync your store first.
                </div>
              ) : (
                <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
                  {products.map(p => (
                    <label
                      key={p.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px',
                        borderRadius: 6, cursor: 'pointer', transition: 'var(--transition)',
                        background: selected.includes(p.id) ? 'var(--accent-subtle)' : 'transparent',
                      }}
                      onMouseEnter={e => { if (!selected.includes(p.id)) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                      onMouseLeave={e => { if (!selected.includes(p.id)) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
                      />
                      <span style={{ flex: 1, fontSize: '13px', fontWeight: selected.includes(p.id) ? 600 : 400, color: selected.includes(p.id) ? 'var(--accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.productTitle || p.title}
                      </span>
                      <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {p.price != null ? `$${p.price}` : ''}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 5 }}>
                {selected.length} selected
              </div>
            </div>

            <Button type="submit" loading={loading} size="lg" style={{ width: '100%' }}>
              {loading ? 'Simulating…' : 'Run simulation'}
            </Button>
          </form>
        </Card>

        {/* Right: Results */}
        <ResultPanel results={results} loading={loading} isPro={isPro} />
      </div>
    </div>
  );
}
