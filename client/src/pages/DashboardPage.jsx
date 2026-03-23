import { useState, useEffect } from 'react'
import { api } from '../api'
import { StatusBadge, MetricCard, Loading, AICard, AIButton, formatCurrency, formatPercent, marginColor } from '../components/UI'

export default function DashboardPage({ shop, refreshKey, onNavigate }) {
  const [data, setData] = useState(null)
  const [aiText, setAiText] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
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
    setAiLoading(true)
    api.aiSummary(shop)
      .then((r) => setAiText(r.analysis))
      .catch(() => setAiText('Unable to generate AI summary.'))
      .finally(() => setAiLoading(false))
  }, [data, shop])

  if (error) return <div className="page"><div className="panel"><div className="panel-body" style={{ color: 'var(--red)' }}>{error}</div></div></div>
  if (!data) return <Loading />

  const { summary, alerts } = data

  return (
    <div className="page">
      <div className="metrics-row animate-in">
        <MetricCard label="Total Products" value={summary.totalProducts} sub={`${summary.totalVariants} variants`} color="accent" />
        <MetricCard label="Healthy Margins" value={summary.healthyMargins} sub="≥ 60% margin" color="green" />
        <MetricCard label="Missing Costs" value={summary.missingCosts} sub="Need attention" color="yellow" />
        <MetricCard label="Low / Losing" value={summary.lowMargins + summary.losingMoney} sub="Below 40% margin" color="red" />
        <MetricCard label="Revenue (30d)" value={formatCurrency(summary.totalRevenue30d)} color="accent" />
      </div>

      <AICard label="AI Summary" loading={aiLoading}>
        {aiText}
      </AICard>

      {alerts.length > 0 && (
        <div className="panel animate-in delay-2">
          <div className="panel-header">
            <span className="panel-title">⚠ Action Required</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alerts.length} items</span>
          </div>
          <div className="panel-body flush">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Cost</th>
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
                    <td className="text-right mono">{formatCurrency(item.price)}</td>
                    <td className="text-right mono">{formatCurrency(item.cost)}</td>
                    <td className="text-right mono" style={{ color: marginColor(item.marginPercent) }}>
                      {formatPercent(item.marginPercent)}
                    </td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>
                      {item.status === 'missing_cost' ? (
                        <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('products')}>Add Cost</button>
                      ) : (
                        <button className="btn btn-sm btn-primary" onClick={() => onNavigate('recommendations')}>Reprice</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
