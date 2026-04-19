import { useState, useEffect } from 'react';
import api from '../api.js';
import { useAuth } from '../App.jsx';
import { Button, Alert, Card, Badge, Skeleton, PageHeader, Tabs, formatCurrency, formatPercent, marginColor } from '../components/UI.jsx';

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

  const summary = results.summary || {};
  const rows = results.results || [];
  const profitDelta = (summary.totalProjectedProfit || 0) - (summary.totalCurrentProfit || 0);
  const profitSign = profitDelta >= 0;
  const goodCount = summary.good || 0;
  const riskyCount = summary.risky || 0;
  const badCount = summary.bad || 0;

  return (
    <Card>
      <div className="font-display" style={{ fontSize: '15px', fontWeight: 700, marginBottom: 20 }}>Simulation Results</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ padding: '14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Current profit</div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatCurrency(summary.totalCurrentProfit)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 3 }}>baseline</div>
        </div>

        <div style={{ padding: '14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Projected profit</div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: profitSign ? 'var(--green)' : 'var(--red)' }}>
            {formatCurrency(summary.totalProjectedProfit)}
          </div>
          <div style={{ fontSize: '12px', color: profitSign ? 'var(--green)' : 'var(--red)', marginTop: 3, fontWeight: 600 }}>
            {profitSign ? '+' : ''}{formatCurrency(profitDelta)} vs baseline
          </div>
        </div>
      </div>

      {/* Status counts */}
      {(goodCount + riskyCount + badCount) > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {goodCount > 0 && <Badge color="green">{goodCount} profitable</Badge>}
          {riskyCount > 0 && <Badge color="yellow">{riskyCount} risky</Badge>}
          {badCount > 0 && <Badge color="red">{badCount} unprofitable</Badge>}
        </div>
      )}

      {!isPro && (
        <div style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--yellow-border)', background: 'var(--yellow-bg)', marginBottom: 16, fontSize: '13px', color: 'var(--yellow)', fontWeight: 500 }}>
          Upgrade to Pro for AI-powered sales lift predictions.
        </div>
      )}

      {/* Per-product breakdown */}
      {rows.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Product breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rows.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 10px', borderRadius: 7, background: 'var(--surface-raised)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.productTitle}
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <span className="mono" style={{ fontSize: '12.5px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>{formatCurrency(p.currentPrice)}</span>
                  <span className="mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>{formatCurrency(p.effectivePrice)}</span>
                  <Badge color={p.newMarginPercent >= 50 ? 'green' : p.newMarginPercent >= 25 ? 'yellow' : 'red'}>{formatPercent(p.newMarginPercent)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// Deal types: effective discount % for simulation
const DEAL_TYPES = [
  { id: 'pct_off', label: 'Percentage off', description: 'e.g. 20% off everything' },
  { id: 'bogof', label: 'BOGOF', description: 'Buy one, get one free (50% eff.)' },
  { id: 'bogo_half', label: 'BOGO 50% off', description: 'Buy one, get one half price (25% eff.)' },
  { id: 'bogo_third', label: 'Buy 2 get 1 free', description: 'Buy two, get one free (33% eff.)' },
  { id: 'fixed', label: 'Fixed amount off', description: 'e.g. $5 off each item' },
];

function effectiveDiscount(dealType, pctValue, fixedValue, price) {
  switch (dealType) {
    case 'bogof': return 50;
    case 'bogo_half': return 25;
    case 'bogo_third': return 33.3;
    case 'fixed': return price > 0 ? Math.min(99, (fixedValue / price) * 100) : pctValue;
    default: return pctValue;
  }
}

/* ─── Discount Simulator ─── */
function DiscountSimulator({ products }) {
  const [discount, setDiscount] = useState(20);
  const [filter, setFilter] = useState('all');

  const rows = products
    .filter(p => p.cost != null && p.price > 0)
    .map(p => {
      const discountedPrice = p.price * (1 - discount / 100);
      const marginAfter = ((discountedPrice - p.cost) / discountedPrice) * 100;
      const marginBefore = ((p.price - p.cost) / p.price) * 100;
      const delta = marginAfter - marginBefore;
      return { ...p, discountedPrice, marginAfter, marginBefore, delta };
    })
    .sort((a, b) => a.delta - b.delta); // worst first

  const filtered = rows.filter(r => {
    if (filter === 'risky') return r.marginAfter >= 0 && r.marginAfter < 15;
    if (filter === 'loss') return r.marginAfter < 0;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <div className="font-display" style={{ fontSize: '15px', fontWeight: 700, marginBottom: 16 }}>Discount Simulator</div>
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Discount %</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <input type="range" min={0} max={100} step={1} value={discount} onChange={e => setDiscount(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--accent)' }} />
            <span className="mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)', minWidth: 50 }}>{discount}%</span>
          </div>
        </div>
      </Card>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { label: 'All', value: 'all' },
          { label: 'Risky (< 15%)', value: 'risky' },
          { label: 'Loss only', value: 'loss' },
        ].map(opt => {
          const active = filter === opt.value;
          return (
            <button key={opt.value} onClick={() => setFilter(opt.value)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)', border: active ? '1px solid var(--accent-border)' : '1px solid var(--border)', background: active ? 'var(--accent-subtle)' : 'var(--surface)', color: active ? 'var(--accent)' : 'var(--text-secondary)' }}>
              {opt.label}
            </button>
          );
        })}
      </div>

      {products.filter(p => p.cost != null).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
          No products with COGS set. Add costs in the Products page.
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
          No products match the current filter.
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead>
                <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
                  {['Product', 'Orig. Price', 'Disc. Price', 'Margin Before', 'Margin After'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: h === 'Product' ? 'left' : 'right', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const isLoss = r.marginAfter < 0;
                  const isRisky = !isLoss && r.marginAfter < 15;
                  const afterColor = isLoss ? 'var(--red)' : isRisky ? 'var(--yellow)' : 'var(--green)';
                  return (
                    <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: isLoss ? 'var(--red-bg)' : 'transparent', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '10px 14px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.productTitle}
                        {isLoss && <span style={{ marginLeft: 6, fontSize: '11.5px', fontWeight: 700, color: 'var(--red)', background: 'var(--red-bg)', padding: '1px 6px', borderRadius: 3, border: '1px solid var(--red-border)' }}>LOSS</span>}
                        {isRisky && !isLoss && <span style={{ marginLeft: 6, fontSize: '11.5px', fontWeight: 700, color: 'var(--yellow)', background: 'var(--yellow-bg)', padding: '1px 6px', borderRadius: 3, border: '1px solid var(--yellow-border)' }}>RISKY</span>}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{formatCurrency(r.price)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: '13.5px', fontWeight: 600, color: 'var(--accent)' }}>{formatCurrency(r.discountedPrice)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: '13px', color: marginColor(r.marginBefore) }}>{formatPercent(r.marginBefore)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: '13.5px', fontWeight: 700, color: afterColor }}>{formatPercent(r.marginAfter)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DealsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [dealType, setDealType] = useState('pct_off');
  const [discount, setDiscount] = useState(15);
  const [fixedAmount, setFixedAmount] = useState(5);
  const [duration, setDuration] = useState(7);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [dealsTab, setDealsTab] = useState('simulator');
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

  const SERVER_DEAL_TYPE = {
    pct_off: 'percent',
    bogof: 'bogo_free',
    bogo_half: 'bogo_percent',
    bogo_third: 'bogo_percent',
    fixed: 'fixed',
  };
  const SERVER_DISCOUNT_VALUE = {
    pct_off: discount,
    bogof: 0,
    bogo_half: 50,
    bogo_third: 33,
    fixed: fixedAmount,
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
        dealType: SERVER_DEAL_TYPE[dealType] || 'percent',
        discountValue: SERVER_DISCOUNT_VALUE[dealType] ?? discount,
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

      <Tabs
        tabs={[
          { id: 'simulator', label: 'Deal Simulator' },
          { id: 'discount', label: 'Discount Simulator' },
        ]}
        activeTab={dealsTab}
        onChange={setDealsTab}
      />

      {dealsTab === 'discount' && (
        <DiscountSimulator products={products} />
      )}

      {dealsTab === 'simulator' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left: Form */}
        <Card>
          <form onSubmit={handleSimulate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="font-display" style={{ fontSize: '15px', fontWeight: 700 }}>Deal parameters</div>

            {/* Deal type */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Deal type</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {DEAL_TYPES.map(dt => (
                  <label key={dt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 7, border: `1px solid ${dealType === dt.id ? 'var(--accent-border)' : 'var(--border)'}`, background: dealType === dt.id ? 'var(--accent-subtle)' : 'var(--surface)', cursor: 'pointer', transition: 'var(--transition)' }}>
                    <input type="radio" name="dealType" value={dt.id} checked={dealType === dt.id} onChange={() => setDealType(dt.id)} style={{ accentColor: 'var(--accent)' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: dealType === dt.id ? 'var(--accent)' : 'var(--text-primary)' }}>{dt.label}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{dt.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Discount amount — only for pct_off */}
            {dealType === 'pct_off' && (
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Discount %</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min={5} max={60} step={5} value={discount} onChange={e => setDiscount(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--accent)' }} />
                  <span className="mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', minWidth: 44 }}>{discount}%</span>
                </div>
              </div>
            )}

            {/* Fixed amount */}
            {dealType === 'fixed' && (
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Amount off ($)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>$</span>
                  <input type="number" min={1} step={1} value={fixedAmount} onChange={e => setFixedAmount(Number(e.target.value))} style={{ width: '100%', padding: '9px 12px 9px 22px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '14px', fontFamily: "'JetBrains Mono', monospace", outline: 'none' }} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </div>
            )}

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
      </div>}
    </div>
  );
}
