import { useState, useEffect, useRef } from 'react';
import api from '../api.js';
import { useAuth } from '../App.jsx';
import {
  MetricCard, Card, Button, Alert, StatusBadge, Skeleton,
  formatCurrency, formatPercent, marginColor, MarginBar, PageHeader, Tabs
} from '../components/UI.jsx';
import ProductsPage from './ProductsPage.jsx';
import RecommendationsPage from './RecommendationsPage.jsx';

/* ─── Health Score Ring ─── */
function HealthRing({ score, loading }) {
  const size = 72;
  const strokeWidth = 6;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = loading ? 0 : Math.min(100, Math.max(0, score || 0));
  const offset = circ - (pct / 100) * circ;

  const color = pct >= 70 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-raised)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={loading ? circ : offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <Skeleton width={28} height={16} />
        ) : (
          <span className="mono" style={{ fontSize: '16px', fontWeight: 700, color, lineHeight: 1 }}>{pct}</span>
        )}
      </div>
    </div>
  );
}

/* ─── AI Summary Card ─── */
function AISummaryCard({ isPro }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [displayed, setDisplayed] = useState('');
  const rafRef = useRef(null);
  const indexRef = useRef(0);

  const generate = async () => {
    if (!isPro) { window.location.href = '/pricing'; return; }
    setLoading(true);
    setSummary(null);
    setDisplayed('');
    indexRef.current = 0;
    try {
      const data = await api.post('/api/ai/summary');
      setSummary(data.summary || data.text || '');
    } catch {
      setSummary('Unable to generate analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!summary) return;
    const type = () => {
      if (indexRef.current < summary.length) {
        setDisplayed(summary.slice(0, indexRef.current + 1));
        indexRef.current++;
        rafRef.current = setTimeout(type, 12);
      }
    };
    type();
    return () => clearTimeout(rafRef.current);
  }, [summary]);

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5l1.2 2.4 2.8.4-2 2 .4 2.8L7 8l-2.4 1.1.4-2.8-2-2 2.8-.4L7 1.5z" stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M2.5 11l1.5-.7M11.5 11l-1.5-.7M7 10.5V12" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-display" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>AI Executive Analysis</span>
          {!isPro && <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: '10.5px', fontWeight: 700, background: 'var(--yellow-bg)', color: 'var(--yellow)', border: '1px solid var(--yellow-border)', letterSpacing: '0.04em' }}>PRO</span>}
        </div>
        <Button variant="secondary" size="sm" loading={loading} onClick={generate}>
          {summary ? 'Refresh' : 'Generate'}
        </Button>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton height={12} />
          <Skeleton height={12} width="88%" />
          <Skeleton height={12} width="72%" />
          <div style={{ height: 12 }} />
          <Skeleton height={12} width="95%" />
          <Skeleton height={12} width="80%" />
        </div>
      )}

      {!loading && !summary && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 0' }}>
          <div style={{ opacity: 0.3, fontSize: 28 }}>✦</div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 260 }}>
            {isPro
              ? 'Generate an AI-powered summary of your store\'s financial health and opportunities.'
              : 'Upgrade to Pro to unlock AI-powered store analysis.'}
          </p>
          {!isPro && <Button size="sm" onClick={() => window.location.href = '/pricing'}>Upgrade to Pro</Button>}
        </div>
      )}

      {!loading && displayed && (
        <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', flex: 1 }}>
          {displayed}
          {displayed.length < (summary?.length || 0) && (
            <span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--accent)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />
          )}
        </div>
      )}
    </Card>
  );
}

/* ─── Quick Insights ─── */
function QuickInsights({ alerts, loading }) {
  if (loading) {
    return (
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skeleton height={14} width="50%" style={{ marginBottom: 4 }} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ padding: '12px', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton height={11} width="80%" />
            <Skeleton height={8} width="100%" />
          </div>
        ))}
      </Card>
    );
  }

  const items = (alerts || []).slice(0, 4);

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div className="font-display" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
        Quick Insights
      </div>
      {items.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
            No alerts — your store looks healthy.
          </p>
        </div>
      ) : (
        items.map((item, i) => {
          const margin = item.margin != null ? item.margin : null;
          const color = marginColor(margin);
          return (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.title || item.productTitle || 'Product'}
              </div>
              <MarginBar pct={margin} width={null} />
              {item.message && (
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{item.message}</div>
              )}
            </div>
          );
        })
      )}
    </Card>
  );
}

/* ─── Alerts Section ─── */
function AlertsSection({ alerts, loading }) {
  if (loading) {
    return (
      <div>
        <Skeleton height={14} width={140} style={{ marginBottom: 12 }} />
        {[1, 2].map(i => <Skeleton key={i} height={52} style={{ marginBottom: 8, borderRadius: 8 }} />)}
      </div>
    );
  }

  const items = alerts || [];
  if (items.length === 0) return null;

  return (
    <div>
      <div className="font-display" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
        Needs attention · <span className="mono" style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{items.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.slice(0, 6).map((item, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '11px 14px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            gap: 12,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.title || item.productTitle}
              </div>
              {item.message && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>{item.message}</div>
              )}
            </div>
            <StatusBadge variant={item.status || (item.margin < 0 ? 'losing' : item.margin == null ? 'missing_cost' : 'low')} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Overview Tab ─── */
function OverviewTab({ data, loading, isPro }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {/* Health Score */}
        <Card style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <>
              <Skeleton height={12} width="60%" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Skeleton height={72} width={72} style={{ borderRadius: '50%' }} />
                <div style={{ flex: 1 }}><Skeleton height={10} /><div style={{ height: 6 }} /><Skeleton height={10} width="60%" /></div>
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Store Health</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <HealthRing score={data?.healthScore} loading={loading} />
                <div>
                  <div className="mono" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 2 }}>
                    {data?.healthScore >= 70 ? 'Good shape' : data?.healthScore >= 50 ? 'Needs work' : 'At risk'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {data?.marginDistribution?.healthy || 0} healthy products
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>

        <MetricCard
          label="Revenue · 30d"
          value={loading ? '—' : formatCurrency(data?.revenue30d)}
          subtext="From synced orders"
          loading={loading}
        />
        <MetricCard
          label="Profit · 30d"
          value={loading ? '—' : formatCurrency(data?.profit30d)}
          accent={data?.profit30d > 0 ? 'var(--green)' : data?.profit30d < 0 ? 'var(--red)' : undefined}
          loading={loading}
        />
        <MetricCard
          label="At Risk"
          value={loading ? '—' : String((data?.atRisk || 0))}
          subtext="Products losing margin"
          accent={data?.atRisk > 0 ? 'var(--red)' : undefined}
          loading={loading}
        />
      </div>

      {/* AI + Insights row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14, alignItems: 'start' }}>
        <AISummaryCard isPro={isPro} />
        <QuickInsights alerts={data?.alerts} loading={loading} />
      </div>

      {/* Alerts */}
      <AlertsSection alerts={data?.alerts} loading={loading} />
    </div>
  );
}

/* ─── Main ─── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isPro = user?.plan === 'pro';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const d = await api.get('/api/dashboard');
        setData(d);
      } catch (err) {
        setError(err.message || 'Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="page-content">
      <PageHeader
        title="Dashboard"
        subtitle={data?.store?.shopDomain ? `${data.store.shopDomain}` : 'Your store at a glance'}
      />

      {error && (
        <div style={{ marginBottom: 16 }}>
          <Alert type="error" message={error} onDismiss={() => setError('')} />
        </div>
      )}

      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'products', label: 'Products', count: data?.totalProducts },
          { id: 'opportunities', label: 'Opportunities', count: data?.atRisk },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'overview' && <OverviewTab data={data} loading={loading} isPro={isPro} />}
      {tab === 'products' && <ProductsPage embedded />}
      {tab === 'opportunities' && <RecommendationsPage embedded />}
    </div>
  );
}
