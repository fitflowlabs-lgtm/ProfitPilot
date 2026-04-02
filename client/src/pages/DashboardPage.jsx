import { useState, useEffect } from 'react'
import { api } from '../api'
import { StatusBadge, MetricCard, Loading, AICard, AIButton, formatCurrency, formatPercent, marginColor } from '../components/UI'
import Disclaimer from '../components/Disclaimer'

export default function DashboardPage({ shop, refreshKey, onNavigate }) {
  const [data, setData] = useState(null)
  const [aiSummary, setAiSummary] = useState(null)
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)
  const [productAnalyses, setProductAnalyses] = useState({})
  const [analyzingProduct, setAnalyzingProduct] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState(null)

  useEffect(() => {
    setData(null)
    setError(null)
    api.dashboard(shop)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [shop, refreshKey])

  useEffect(() => {
    if (!data) return
    setAiSummaryLoading(true)
    api.aiSummary(shop)
      .then((r) => setAiSummary(r.analysis))
      .catch(() => setAiSummary('Unable to generate AI summary.'))
      .finally(() => setAiSummaryLoading(false))
  }, [data, shop])

  const handleAnalyzeProduct = async (variantId) => {
    setAnalyzingProduct(variantId)
    try {
      const r = await api.aiProduct(shop, variantId)
      setProductAnalyses((prev) => ({ ...prev, [variantId]: r.analysis }))
    } catch {
      setProductAnalyses((prev) => ({ ...prev, [variantId]: 'Failed to analyze.' }))
    }
    setAnalyzingProduct(null)
  }

  if (error) return <div className="page"><div className="panel"><div className="panel-body" style={{ color: 'var(--red)' }}>{error}</div></div></div>
  if (!data) return <Loading />

  const { summary, alerts, products } = data

  // Derived lists for AI insights
  const losingProducts = products.filter((p) => p.marginPercent != null && p.marginPercent < 0)
  const lowProducts = products.filter((p) => p.marginPercent != null && p.marginPercent >= 0 && p.marginPercent < 40)
  const missingCostProducts = products.filter((p) => p.cost == null)
  const topPerformers = [...products]
    .filter((p) => p.marginPercent != null && p.revenue30d > 0)
    .sort((a, b) => (b.revenue30d || 0) - (a.revenue30d || 0))
    .slice(0, 5)
  const worstMargins = [...products]
    .filter((p) => p.marginPercent != null)
    .sort((a, b) => a.marginPercent - b.marginPercent)
    .slice(0, 5)
  const withMargin = products.filter((p) => p.marginPercent != null)
  const avgMargin = withMargin.length > 0
    ? withMargin.reduce((s, p) => s + p.marginPercent, 0) / withMargin.length
    : null

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products' },
    { id: 'opportunities', label: 'Opportunities' },
  ]

  return (
    <div className="page">

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 2, padding: 4, background: 'var(--surface-raised)', borderRadius: 10, width: 'fit-content', marginBottom: 24 }} className="animate-in">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 20px', borderRadius: 7, border: 'none',
              background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.82rem', fontWeight: activeTab === tab.id ? 600 : 450,
              fontFamily: 'var(--font-body)', cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <>
          {/* Metric row */}
          <div className="metrics-row animate-in">
            <div className="metric-card accent" style={{ gridColumn: 'span 2' }}>
              <div className="metric-label">Store Health Score</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <div className="metric-value" style={{ color: avgMargin == null ? undefined : avgMargin >= 60 ? 'var(--green)' : avgMargin >= 40 ? 'var(--yellow)' : 'var(--red)' }}>
                  {avgMargin != null ? `${avgMargin.toFixed(0)}%` : '—'}
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>avg margin</span>
              </div>
              <div className="metric-sub">
                {summary.healthyMargins} healthy · {summary.lowMargins} low · {summary.losingMoney} losing · {summary.missingCosts} missing costs
              </div>
            </div>
            <MetricCard label="Revenue (30d)" value={formatCurrency(summary.totalRevenue30d)} color="accent" />
            <MetricCard label="Profit (30d)" value={formatCurrency(summary.totalProfit30d)} color="green" />
            <MetricCard label="At Risk" value={losingProducts.length + lowProducts.length} sub="Need action" color="red" />
          </div>

          {/* Two-column: AI summary + insight cards */}
          <div className="split-row animate-in delay-1" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 55%' }}>
              <AICard label="Executive Analysis" loading={aiSummaryLoading}>
                {aiSummary}
              </AICard>
            </div>

            <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {losingProducts.length === 0 && missingCostProducts.length === 0 && lowProducts.length === 0 && alerts.length === 0 && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '32px 20px', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, textAlign: 'center', gap: 10,
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1.5px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>All clear</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                    No issues detected. Your store margins look healthy.
                  </p>
                </div>
              )}
              {losingProducts.length > 0 && (
                <div className="ai-insight-item">
                  <span className="ai-insight-tag risk">Risk</span>
                  <h3>{losingProducts.length} Product{losingProducts.length > 1 ? 's' : ''} Losing Money</h3>
                  <p>
                    {losingProducts.map((p) => p.productTitle).join(', ')} — priced below cost.
                    Every sale increases your losses.{' '}
                    <button onClick={() => onNavigate('recommendations')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit', padding: 0, fontWeight: 600 }}>Reprice now →</button>
                  </p>
                </div>
              )}
              {missingCostProducts.length > 0 && (
                <div className="ai-insight-item">
                  <span className="ai-insight-tag info">Blind Spot</span>
                  <h3>{missingCostProducts.length} Products Missing Cost Data</h3>
                  <p>
                    Without COGS, margin analysis is impossible for these SKUs.{' '}
                    <button onClick={() => onNavigate('products')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit', padding: 0, fontWeight: 600 }}>Add costs →</button>
                  </p>
                </div>
              )}
              {topPerformers.length > 0 && (
                <div className="ai-insight-item">
                  <span className="ai-insight-tag opportunity">Opportunity</span>
                  <h3>Top Revenue Driver</h3>
                  <p>
                    {topPerformers[0].productTitle} — {formatCurrency(topPerformers[0].revenue30d)} in 30d at {formatPercent(topPerformers[0].marginPercent)} margin.
                    {topPerformers[0].marginPercent < 60 ? ' Room to increase price.' : ' Strong — protect this margin.'}
                  </p>
                </div>
              )}
              {lowProducts.length > 0 && (
                <div className="ai-insight-item">
                  <span className="ai-insight-tag action">Action</span>
                  <h3>{lowProducts.length} Low-Margin SKUs</h3>
                  <p>
                    {lowProducts.slice(0, 3).map((p) => p.productTitle).join(', ')}{lowProducts.length > 3 ? ` +${lowProducts.length - 3} more` : ''} under 40% margin.
                  </p>
                </div>
              )}

              {/* Alerts table — sits under the insight cards in the right column */}
              {alerts.length > 0 && (
                <div className="panel" style={{ marginTop: 4 }}>
                  <div className="panel-header">
                    <span className="panel-title">⚠ Action Required</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alerts.length} items</span>
                  </div>
                  <div className="panel-body flush">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th className="text-right">Margin</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {alerts.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <span className="product-name">{item.productTitle}</span>
                              <br /><span className="variant-name">{item.sku}</span>
                            </td>
                            <td className="text-right mono" style={{ color: marginColor(item.marginPercent) }}>
                              {formatPercent(item.marginPercent)}
                            </td>
                            <td><StatusBadge status={item.status} /></td>
                            <td>
                              {item.status === 'missing_cost'
                                ? <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('products')}>Add Cost</button>
                                : <button className="btn btn-sm btn-primary" onClick={() => onNavigate('recommendations')}>Reprice</button>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════
          PRODUCTS TAB
      ══════════════════════════════════════ */}
      {activeTab === 'products' && (
        <>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 20 }} className="animate-in">
            Click <strong style={{ color: 'var(--accent)' }}>Analyze</strong> on any product for a detailed AI assessment of pricing and margin strategy.
          </p>

          {/* Inline AI analysis cards */}
          {Object.entries(productAnalyses).map(([variantId, text]) => {
            const product = products.find((p) => p.id === variantId)
            if (!product) return null
            return (
              <AICard
                key={variantId}
                label={`Analysis: ${product.productTitle}`}
                loading={false}
                onClose={() => setProductAnalyses((prev) => { const next = { ...prev }; delete next[variantId]; return next })}
              >
                {text}
              </AICard>
            )
          })}

          <div className="panel animate-in">
            <div className="panel-header">
              <span className="panel-title">All Products</span>
            </div>
            <div className="panel-body flush">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Cost</th>
                    <th className="text-right">Margin</th>
                    <th className="text-right">Revenue (30d)</th>
                    <th className="text-right">Units (30d)</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="product-name">{p.productTitle}</span>
                        <br /><span className="variant-name">{p.sku}</span>
                      </td>
                      <td className="text-right mono">{formatCurrency(p.price)}</td>
                      <td className="text-right mono">{formatCurrency(p.cost)}</td>
                      <td className="text-right mono" style={{ color: marginColor(p.marginPercent) }}>
                        {formatPercent(p.marginPercent)}
                      </td>
                      <td className="text-right mono">{formatCurrency(p.revenue30d)}</td>
                      <td className="text-right mono">{p.unitsSold30}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>
                        <AIButton
                          onClick={() => handleAnalyzeProduct(p.id)}
                          loading={analyzingProduct === p.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════
          OPPORTUNITIES TAB
      ══════════════════════════════════════ */}
      {activeTab === 'opportunities' && (
        <>
          <div className="split-row animate-in">
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title" style={{ color: 'var(--red)' }}>⚠ Worst Margins</span>
              </div>
              <div className="panel-body flush">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">Margin</th>
                      <th className="text-right">Profit/Unit</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {worstMargins.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <span className="product-name">{p.productTitle}</span>
                          <br /><span className="variant-name">{p.sku}</span>
                        </td>
                        <td className="text-right mono" style={{ color: marginColor(p.marginPercent) }}>{formatPercent(p.marginPercent)}</td>
                        <td className="text-right mono" style={{ color: marginColor(p.marginPercent) }}>{formatCurrency(p.profit)}</td>
                        <td>
                          <AIButton
                            onClick={() => { handleAnalyzeProduct(p.id); setActiveTab('products') }}
                            loading={analyzingProduct === p.id}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-title" style={{ color: 'var(--green)' }}>★ Top Performers</span>
              </div>
              <div className="panel-body flush">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">Revenue (30d)</th>
                      <th className="text-right">Margin</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPerformers.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <span className="product-name">{p.productTitle}</span>
                          <br /><span className="variant-name">{p.sku}</span>
                        </td>
                        <td className="text-right mono">{formatCurrency(p.revenue30d)}</td>
                        <td className="text-right mono" style={{ color: marginColor(p.marginPercent) }}>{formatPercent(p.marginPercent)}</td>
                        <td>
                          <AIButton
                            onClick={() => { handleAnalyzeProduct(p.id); setActiveTab('products') }}
                            loading={analyzingProduct === p.id}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Margin distribution chart */}
          <div className="panel animate-in delay-1">
            <div className="panel-header">
              <span className="panel-title">Margin Distribution</span>
            </div>
            <div className="panel-body" style={{ padding: 28 }}>
              {(() => {
                const buckets = { neg: 0, '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80+': 0, na: 0 }
                products.forEach((p) => {
                  if (p.marginPercent == null) buckets.na++
                  else if (p.marginPercent < 0) buckets.neg++
                  else if (p.marginPercent < 20) buckets['0-20']++
                  else if (p.marginPercent < 40) buckets['20-40']++
                  else if (p.marginPercent < 60) buckets['40-60']++
                  else if (p.marginPercent < 80) buckets['60-80']++
                  else buckets['80+']++
                })
                const maxBucket = Math.max(...Object.values(buckets), 1)
                const barData = [
                  { label: 'Neg', count: buckets.neg, color: 'var(--red)' },
                  { label: '0-20%', count: buckets['0-20'], color: 'var(--red)', opacity: 0.7 },
                  { label: '20-40%', count: buckets['20-40'], color: 'var(--yellow)' },
                  { label: '40-60%', count: buckets['40-60'], color: 'var(--yellow)', opacity: 0.7 },
                  { label: '60-80%', count: buckets['60-80'], color: 'var(--green)' },
                  { label: '80%+', count: buckets['80+'], color: 'var(--green)', opacity: 0.7 },
                  { label: 'N/A', count: buckets.na, color: 'var(--text-muted)', opacity: 0.4 },
                ]
                return (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
                    {barData.map((bar) => (
                      <div key={bar.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: '100%', background: bar.color, borderRadius: '4px 4px 0 0',
                          height: `${Math.max(8, (bar.count / maxBucket) * 140)}px`,
                          opacity: bar.opacity || 1, transition: 'height 0.6s ease',
                        }} />
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center' }}>{bar.label}</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{bar.count}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </>
      )}

      <Disclaimer />
    </div>
  )
}
