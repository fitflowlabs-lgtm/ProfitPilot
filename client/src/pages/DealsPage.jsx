import { useState, useEffect } from 'react'
import { api } from '../api'
import { StatusBadge, MetricCard, Loading, AICard, AIButton, formatCurrency, formatPercent, marginColor } from '../components/UI'

export default function DealsPage({ shop, refreshKey }) {
  const [products, setProducts] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [dealType, setDealType] = useState('percent')
  const [discountValue, setDiscountValue] = useState(15)
  const [extraCost, setExtraCost] = useState(0)
  const [results, setResults] = useState(null)
  const [simulating, setSimulating] = useState(false)
  const [aiText, setAiText] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiLift, setAiLift] = useState(null)

  useEffect(() => {
    api.products(shop).then((d) => setProducts(d.products))
  }, [shop, refreshKey])

  if (!products) return <Loading />

  const toggleSelect = (id) => {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === products.length) setSelected(new Set())
    else setSelected(new Set(products.map((p) => p.id)))
  }

  const handleSimulate = async () => {
    if (selected.size === 0) return
    setSimulating(true)
    setAiText(null)
    setAiLift(null)

    // First, ask AI to predict the sales lift
    setAiLoading(true)
    let predictedLift = 15 // fallback default

    try {
      const selectedProducts = products.filter((p) => selected.has(p.id))
      const aiLiftRes = await api.aiDeal(shop, {
        request: 'predict_lift',
        dealType,
        discountValue: Number(discountValue),
        extraCost: Number(extraCost),
        products: selectedProducts.map((p) => ({
          productTitle: p.productTitle,
          sku: p.sku,
          price: p.price,
          cost: p.cost,
          marginPercent: p.marginPercent,
          inventoryQty: p.inventoryQty,
        })),
      })

      // Try to extract a number from the AI response
      const match = aiLiftRes.analysis.match(/(\d+(?:\.\d+)?)\s*%/)
      if (match) {
        predictedLift = parseFloat(match[1])
      }
      setAiLift({ percent: predictedLift, reasoning: aiLiftRes.analysis })
    } catch {
      setAiLift({ percent: predictedLift, reasoning: 'Using default estimate of 15% lift.' })
    }

    try {
      const res = await api.simulateDeals(shop, {
        variantIds: Array.from(selected),
        dealType,
        discountValue: Number(discountValue),
        extraCost: Number(extraCost),
        projectedLiftPercent: predictedLift,
      })
      setResults(res)

      // Get full AI analysis
      try {
        const ai = await api.aiDeal(shop, { ...res, dealType, discountValue: Number(discountValue), predictedLift })
        setAiText(ai.analysis)
      } catch {
        setAiText('Unable to generate AI analysis.')
      }
    } catch (e) {
      console.error(e)
    }

    setAiLoading(false)
    setSimulating(false)
  }

  return (
    <div className="page">
      <div className="split-row animate-in">
        {/* Setup Panel */}
        <div className="panel" style={{ flex: '0 0 340px' }}>
          <div className="panel-header">
            <span className="panel-title">Promo Setup</span>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gap: 16 }}>
              <div className="form-group">
                <label>Deal Type</label>
                <select value={dealType} onChange={(e) => setDealType(e.target.value)}>
                  <option value="percent">Percent Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                  <option value="bogo_free">Buy One Get One Free</option>
                  <option value="bogo_percent">BOGO % Off</option>
                </select>
              </div>
              <div className="form-group">
                <label>Discount Value</label>
                <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Extra Cost Per Promo</label>
                <input type="number" value={extraCost} onChange={(e) => setExtraCost(e.target.value)} placeholder="Shipping, packaging…" />
              </div>

              {aiLift && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.05))',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: 8,
                  padding: '12px 14px',
                }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontWeight: 700, marginBottom: 6 }}>
                    ✦ AI-Predicted Sales Lift
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {aiLift.percent}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                    Based on your product data, margins, and discount depth.
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                onClick={handleSimulate}
                disabled={simulating || selected.size === 0}
              >
                {simulating ? 'Analyzing & Simulating…' : `Simulate ${selected.size} Product${selected.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Results Summary */}
          {results && (
            <>
              <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <MetricCard label="Current Profit (30d)" value={formatCurrency(results.summary.totalCurrentProfit)} color="green" />
                <MetricCard
                  label="Projected Deal Profit"
                  value={formatCurrency(results.summary.totalProjectedProfit)}
                  sub={results.summary.totalProjectedProfit > results.summary.totalCurrentProfit
                    ? `+${formatCurrency(results.summary.totalProjectedProfit - results.summary.totalCurrentProfit)}`
                    : `${formatCurrency(results.summary.totalProjectedProfit - results.summary.totalCurrentProfit)}`}
                  color="accent"
                />
                <MetricCard
                  label="Deal Quality"
                  value={`${results.summary.good} Good`}
                  sub={`${results.summary.risky} Risky · ${results.summary.bad} Bad`}
                  color={results.summary.bad > 0 ? 'red' : results.summary.risky > 0 ? 'yellow' : 'green'}
                />
              </div>

              <AICard label="AI Deal Recommendation" loading={aiLoading}>
                {aiText}
              </AICard>

              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">Per-Product Results</span>
                </div>
                <div className="panel-body flush">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Promo Price</th>
                        <th className="text-right">New Margin</th>
                        <th className="text-right">Sold 30d</th>
                        <th className="text-right">Projected</th>
                        <th className="text-right">Δ Profit</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.results.map((r) => {
                        const profitDiff = (r.projectedDealProfit ?? 0) - (r.currentTotalProfit ?? 0)
                        return (
                          <tr key={r.variantId}>
                            <td>
                              <span className="product-name">{r.productTitle}</span>
                              <br /><span className="variant-name">{r.sku}</span>
                            </td>
                            <td className="text-right mono">{formatCurrency(r.currentPrice)}</td>
                            <td className="text-right mono">{formatCurrency(r.effectivePrice)}</td>
                            <td className="text-right mono" style={{ color: marginColor(r.newMarginPercent) }}>
                              {formatPercent(r.newMarginPercent)}
                            </td>
                            <td className="text-right mono">{r.unitsSold30}</td>
                            <td className="text-right mono">{r.projectedUnits}</td>
                            <td className="text-right mono" style={{ color: profitDiff >= 0 ? 'var(--green)' : 'var(--red)' }}>
                              {profitDiff >= 0 ? '+' : ''}{formatCurrency(profitDiff)}
                            </td>
                            <td><StatusBadge status={r.status} /></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Product Selector */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Select Products</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selected.size} selected</span>
            </div>
            <div className="panel-body flush">
              <table className="data-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" className="custom-check" checked={selected.size === products.length} onChange={toggleAll} /></th>
                    <th>Product</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Cost</th>
                    <th className="text-right">Margin</th>
                    <th className="text-right">Inventory</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td><input type="checkbox" className="custom-check" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                      <td>
                        <span className="product-name">{p.productTitle}</span>
                        <br /><span className="variant-name">{p.sku}</span>
                      </td>
                      <td className="text-right mono">{formatCurrency(p.price)}</td>
                      <td className="text-right mono">{formatCurrency(p.cost)}</td>
                      <td className="text-right mono" style={{ color: marginColor(p.marginPercent) }}>
                        {formatPercent(p.marginPercent)}
                      </td>
                      <td className="text-right mono">{p.inventoryQty ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
