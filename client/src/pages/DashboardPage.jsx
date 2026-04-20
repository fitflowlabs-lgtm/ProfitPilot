import { useState, useEffect, useRef } from 'react';
import api from '../api.js';
import { useAuth } from '../App.jsx';
import { Card, Button, Alert, StatusBadge, Skeleton, PageHeader, formatCurrency, formatPercent, marginColor, MarginBar, Badge } from '../components/UI.jsx';
import { BreakEvenCard, PnLCard } from '../components/DashboardCards.jsx';

/* ─── Health Score Ring ─── */
function HealthRing({ score, loading }) {
  const size = 68;
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score || 0));
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 70 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-raised)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={loading ? circ : offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1), stroke 0.4s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? <Skeleton width={28} height={14} /> : <span className="mono" style={{ fontSize: '15px', fontWeight: 700, color, lineHeight: 1 }}>{pct}</span>}
      </div>
    </div>
  );
}

/* ─── AI Summary ─── */
function AISummaryCard({ isPro }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayed, setDisplayed] = useState('');
  const timerRef = useRef(null);

  const generate = async () => {
    if (!isPro) { window.location.href = '/pricing'; return; }
    setLoading(true);
    setText('');
    setDisplayed('');
    try {
      const data = await api.post('/api/ai/summary');
      setText(data.summary || data.text || '');
    } catch {
      setText('Unable to generate analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!text) return;
    let i = 0;
    const tick = () => {
      if (i <= text.length) { setDisplayed(text.slice(0, i)); i++; timerRef.current = setTimeout(tick, 12); }
    };
    tick();
    return () => clearTimeout(timerRef.current);
  }, [text]);

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1.5l1 2.2 2.5.4-1.8 1.8.4 2.6L6.5 7.4l-2.1 1.1.4-2.6L3 4.1l2.5-.4 1-2.2z" stroke="var(--accent)" strokeWidth="1.1" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-display" style={{ fontSize: '14px', fontWeight: 700 }}>AI Executive Analysis</span>
          {!isPro && <span style={{ padding: '2px 6px', borderRadius: 3, fontSize: '10px', fontWeight: 700, background: 'var(--yellow-bg)', color: 'var(--yellow)', border: '1px solid var(--yellow-border)' }}>PRO</span>}
        </div>
        <Button variant="secondary" size="sm" loading={loading} onClick={generate}>{text ? 'Refresh' : 'Generate'}</Button>
      </div>

      {loading && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1, 0.88, 0.72, 1, 0.9, 0.6].map((w, i) => <Skeleton key={i} height={11} width={`${w*100}%`} />)}</div>}

      {!loading && !text && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '20px 0' }}>
          <div style={{ opacity: 0.2, fontSize: 28 }}>✦</div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 240 }}>
            {isPro ? 'Generate an AI-powered summary of your store\'s financial health.' : 'Upgrade to Pro to unlock AI store analysis.'}
          </p>
          {!isPro && <Button size="sm" onClick={() => window.location.href = '/pricing'}>Upgrade to Pro</Button>}
        </div>
      )}

      {!loading && text && (
        <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {displayed}
          {displayed.length < text.length && <span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--accent)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />}
        </div>
      )}
    </Card>
  );
}

/* ─── Issues Panel ─── */
function IssuesPanel({ summary, alerts, loading }) {
  if (loading) {
    return (
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton height={14} width="45%" style={{ marginBottom: 6 }} />
        {[1,2,3].map(i => <Skeleton key={i} height={48} style={{ borderRadius: 8 }} />)}
      </Card>
    );
  }

  const issues = [];

  if (summary?.missingCosts > 0) {
    issues.push({
      type: 'warning',
      icon: '◎',
      title: `${summary.missingCosts} product${summary.missingCosts !== 1 ? 's' : ''} missing cost`,
      desc: 'Margin can\'t be calculated without a cost. Add COGS in Products.',
      href: '/products',
    });
  }

  // Unusual costs from alerts
  const unusualCost = (alerts || []).filter(a => a.unusualCost);
  if (unusualCost.length > 0) {
    issues.push({
      type: 'warning',
      icon: '⚠',
      title: `${unusualCost.length} product${unusualCost.length !== 1 ? 's' : ''} with unusual cost`,
      desc: 'Cost may be too high relative to price — verify before acting.',
      href: '/products?tab=recommendations',
    });
  }

  if (summary?.losingMoney > 0) {
    issues.push({
      type: 'error',
      icon: '↓',
      title: `${summary.losingMoney} product${summary.losingMoney !== 1 ? 's' : ''} losing money`,
      desc: 'Selling below cost. Raise prices or reduce costs.',
      href: '/products?tab=recommendations',
    });
  }

  if (summary?.lowMargins > 0) {
    issues.push({
      type: 'warning',
      icon: '~',
      title: `${summary.lowMargins} product${summary.lowMargins !== 1 ? 's' : ''} with low margin`,
      desc: 'Below 40% margin — consider a price adjustment.',
      href: '/products?tab=recommendations',
    });
  }

  const typeColors = {
    error: { color: 'var(--red)', bg: 'var(--red-bg)', border: 'var(--red-border)' },
    warning: { color: 'var(--yellow)', bg: 'var(--yellow-bg)', border: 'var(--yellow-border)' },
  };

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div className="font-display" style={{ fontSize: '14px', fontWeight: 700 }}>Issues to address</div>
      {issues.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '20px 0' }}>
          <div style={{ fontSize: 26, opacity: 0.3 }}>✓</div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>No issues detected. Your store looks healthy.</p>
        </div>
      ) : (
        issues.map((issue, i) => {
          const c = typeColors[issue.type];
          return (
            <a key={i} href={issue.href} style={{ textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 8, background: c.bg, border: `1px solid ${c.border}`, transition: 'opacity 0.15s ease' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <span style={{ fontSize: '13px', color: c.color, flexShrink: 0, marginTop: 1 }}>{issue.icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{issue.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{issue.desc}</div>
              </div>
            </a>
          );
        })
      )}
    </Card>
  );
}

/* ─── Top Products ─── */
function TopProductsCard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/reports/profitability')
      .then(d => setRows((d.products || d.rows || d || []).slice(0, 10)))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="font-display" style={{ fontSize: '14px', fontWeight: 700 }}>Top Products</div>
        <a href="/reports/profitability" style={{ fontSize: '12.5px', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>View all →</a>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <Skeleton key={i} height={36} />)}
        </div>
      ) : rows.length === 0 ? (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No profitability data yet.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: 460 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['#', 'Product', 'Units', 'Revenue', 'Gross Profit', 'Margin %'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: h === '#' || h === 'Product' ? 'left' : 'right', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const mc = marginColor(r.marginPercent);
                return (
                  <tr key={r.id || i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{r.productTitle || r.title}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{(r.unitsSold ?? r.unitsSold30d ?? '—').toLocaleString?.() ?? '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{formatCurrency(r.revenue ?? r.revenue30d)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: mc }}>{formatCurrency(r.grossProfit ?? r.profit)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: mc }}>{formatPercent(r.marginPercent)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ─── Main ─── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isPro = user?.plan === 'pro';

  useEffect(() => {
    api.get('/api/dashboard')
      .then(d => setData(d))
      .catch(e => setError(e.message || 'Could not load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  // Server response shape:
  // { store, summary: { totalProducts, totalVariants, missingCosts, lowMargins, losingMoney, healthyMargins, totalRevenue30d, totalProfit30d }, alerts, products }
  const s = data?.summary;
  const totalVariants = s?.totalVariants || 0;
  const healthyPct = totalVariants > 0 ? Math.round((s.healthyMargins / totalVariants) * 100) : 0;
  const healthScore = healthyPct;

  return (
    <div className="page-content">
      <PageHeader title="Dashboard" subtitle={data?.store?.shop ? `${data.store.shop}` : 'Your store at a glance'} />

      {error && <div style={{ marginBottom: 16 }}><Alert type="error" message={error} onDismiss={() => setError('')} /></div>}

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 20 }}>
        {/* Health */}
        <Card style={{ minWidth: 0 }}>
          {loading ? (
            <><Skeleton height={11} width="55%" style={{ marginBottom: 12 }} /><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Skeleton height={68} width={68} style={{ borderRadius: '50%' }} /><div style={{ flex: 1 }}><Skeleton height={10} /><div style={{ height: 6 }} /><Skeleton height={10} width="60%" /></div></div></>
          ) : (
            <>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>Store Health</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <HealthRing score={healthScore} loading={loading} />
                <div>
                  <div className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 2 }}>
                    {healthScore >= 70 ? 'Good shape' : healthScore >= 50 ? 'Needs work' : 'At risk'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s?.healthyMargins || 0} healthy products</div>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Revenue */}
        <Card style={{ minWidth: 0 }}>
          {loading ? <><Skeleton height={11} width="50%" style={{ marginBottom: 12 }} /><Skeleton height={26} width="65%" style={{ marginBottom: 6 }} /><Skeleton height={10} width="40%" /></> : (
            <>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>Revenue · 30d</div>
              <div className="mono" style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 4 }}>{formatCurrency(s?.totalRevenue30d)}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From synced orders</div>
            </>
          )}
        </Card>

        {/* Profit */}
        <Card style={{ minWidth: 0 }}>
          {loading ? <><Skeleton height={11} width="50%" style={{ marginBottom: 12 }} /><Skeleton height={26} width="65%" style={{ marginBottom: 6 }} /><Skeleton height={10} width="40%" /></> : (
            <>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>Profit · 30d</div>
              <div className="mono" style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 4, color: (s?.totalProfit30d || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatCurrency(s?.totalProfit30d)}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s?.losingMoney || 0} products losing money</div>
            </>
          )}
        </Card>

        {/* At risk */}
        <Card style={{ minWidth: 0 }}>
          {loading ? <><Skeleton height={11} width="50%" style={{ marginBottom: 12 }} /><Skeleton height={26} width="40%" style={{ marginBottom: 6 }} /><Skeleton height={10} width="55%" /></> : (
            <>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>At Risk</div>
              <div className="mono" style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 4, color: (s?.losingMoney + s?.lowMargins) > 0 ? 'var(--red)' : 'var(--green)' }}>
                {(s?.losingMoney || 0) + (s?.lowMargins || 0)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s?.missingCosts || 0} missing costs</div>
            </>
          )}
        </Card>
      </div>

      {/* AI + Issues */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, alignItems: 'start', marginBottom: 24 }}>
        <AISummaryCard isPro={isPro} />
        <IssuesPanel summary={s} alerts={data?.alerts} loading={loading} />
      </div>

      {/* Top Products */}
      {!loading && <TopProductsCard />}

      {/* Break-even */}
      {!loading && <BreakEvenCard products={data?.products || []} />}

      {/* P&L */}
      {!loading && <PnLCard />}

      {/* Alerts list */}
      {!loading && (data?.alerts || []).length > 0 && (
        <div>
          <div className="font-display" style={{ fontSize: '14px', fontWeight: 700, marginBottom: 10 }}>
            Needs attention · <span className="mono" style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{data.alerts.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {data.alerts.slice(0, 8).map((item, i) => (
              <a key={i} href="/products" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', gap: 12, transition: 'border-color 0.15s ease' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-border)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productTitle}</div>
                  {item.sku && item.sku !== 'Default' && <div className="mono" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{item.sku}</div>}
                </div>
                {item.marginPercent != null && <MarginBar pct={item.marginPercent} width={80} />}
                <StatusBadge variant={item.status === 'good' ? 'healthy' : item.status === 'okay' ? 'low' : item.status === 'missing_cost' ? 'missing_cost' : item.status === 'losing' ? 'losing' : 'low'} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
