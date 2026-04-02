import { useState, useEffect } from 'react'
import { api } from '../api'
import { StatusBadge, Loading, AICard, AIButton, formatCurrency, formatPercent, marginColor } from '../components/UI'

export default function RecommendationsPage({ shop, refreshKey }) {
  const [recs, setRecs] = useState(null)
  const [applying, setApplying] = useState({})
  const [applyingAll, setApplyingAll] = useState(false)
  const [aiModal, setAiModal] = useState(null)
  const [analyzingId, setAnalyzingId] = useState(null)

  useEffect(() => {
    api.recommendations(shop).then((d) => setRecs(d.recommendations))
  }, [shop, refreshKey])

  if (!recs) return <Loading />

  const handleApply = async (variantId, suggestedPrice) => {
    setApplying((s) => ({ ...s, [variantId]: true }))
    try {
      await api.applyPrice(shop, variantId, suggestedPrice)
      const d = await api.recommendations(shop)
      setRecs(d.recommendations)
    } catch (e) {
      console.error(e)
    }
    setApplying((s) => ({ ...s, [variantId]: false }))
  }

  const handleUndo = async (variantId) => {
    try {
      await api.undoPrice(shop, variantId)
      const d = await api.recommendations(shop)
      setRecs(d.recommendations)
    } catch (e) {
      console.error(e)
    }
  }

  const handleApplyAll = async () => {
    setApplyingAll(true)
    try {
      await api.applyAllPrices(shop)
      const d = await api.recommendations(shop)
      setRecs(d.recommendations)
    } catch (e) {
      console.error(e)
    }
    setApplyingAll(false)
  }

  const handleAI = async (variantId) => {
    setAnalyzingId(variantId)
    setAiModal({ variantId, loading: true, text: '' })
    try {
      const r = await api.aiProduct(shop, variantId)
      setAiModal({ variantId, loading: false, text: r.analysis })
    } catch (e) {
      setAiModal({ variantId, loading: false, text: 'Failed to get AI analysis.' })
    }
    setAnalyzingId(null)
  }

  const needsAction = recs.filter((r) => r.status === 'losing' || r.status === 'low')

  return (
    <div className="page">
      {needsAction.length > 0 && (
        <div className="ai-card animate-in" style={{ marginBottom: 24 }}>
          <div className="ai-label">✦ Pricing Intelligence</div>
          <div className="ai-text">
            {needsAction.length} product{needsAction.length > 1 ? 's are' : ' is'} priced below the 60% margin target.
            Applying suggested prices could recover estimated margin across these SKUs.
            Review each recommendation below before applying.
          </div>
        </div>
      )}

      {aiModal && (
        <AICard label="AI Pricing Analysis" loading={aiModal.loading} onClose={() => setAiModal(null)}>
          {aiModal.text}
        </AICard>
      )}

      <div className="panel animate-in delay-1">
        <div className="panel-header">
          <span className="panel-title">Price Recommendations</span>
          <button className="btn btn-primary btn-sm" onClick={handleApplyAll} disabled={applyingAll}>
            {applyingAll ? 'Applying…' : 'Apply All Suggested Prices'}
          </button>
        </div>
        <div className="panel-body flush">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-right">Current Price</th>
                <th className="text-right">Cost</th>
                <th className="text-right">Current Margin</th>
                <th className="text-right">Suggested Price</th>
                <th className="text-right">Δ</th>
                <th>Recommendation</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recs.map((r) => {
                const diffColor = r.priceDifference > 0 ? 'var(--red)' : r.priceDifference < 0 ? 'var(--green)' : undefined
                return (
                  <tr key={r.variantId}>
                    <td>
                      <span className="product-name">{r.productTitle}</span>
                      <br /><span className="variant-name">{r.sku}</span>
                    </td>
                    <td className="text-right mono">{formatCurrency(r.currentPrice)}</td>
                    <td className="text-right mono">{formatCurrency(r.cost)}</td>
                    <td className="text-right mono" style={{ color: marginColor(r.currentMargin) }}>
                      {formatPercent(r.currentMargin)}
                    </td>
                    <td className="text-right mono" style={{ color: r.suggestedPrice != null ? 'var(--accent)' : undefined }}>
                      {r.suggestedPrice != null ? formatCurrency(r.suggestedPrice) : '—'}
                    </td>
                    <td className="text-right mono" style={{ color: diffColor }}>
                      {r.priceDifference != null ? `${r.priceDifference > 0 ? '+' : ''}${formatCurrency(r.priceDifference)}` : '—'}
                    </td>
                    <td style={{ fontSize: '0.82rem', maxWidth: 220 }}>
                      {r.unusualCost && (
                        <span style={{ display: 'inline-block', marginBottom: 3, padding: '2px 7px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', background: 'var(--yellow-bg)', color: 'var(--yellow)', border: '1px solid var(--yellow-border)' }}>
                          ⚠ Verify cost
                        </span>
                      )}
                      {r.unusualCost && <br />}
                      <span style={{ color: r.unusualCost ? 'var(--yellow)' : marginColor(r.currentMargin) }}>
                        {r.recommendation}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {r.suggestedPrice != null && r.status !== 'good' && (
                          <button
                            className={`btn btn-sm ${r.status === 'losing' ? 'btn-danger' : 'btn-primary'}`}
                            onClick={() => handleApply(r.variantId, r.suggestedPrice)}
                            disabled={applying[r.variantId]}
                          >
                            Apply
                          </button>
                        )}
                        {r.previousPrice != null && (
                          <button className="btn btn-sm btn-ghost" onClick={() => handleUndo(r.variantId)}>
                            Undo
                          </button>
                        )}
                        <AIButton
                          onClick={() => handleAI(r.variantId)}
                          loading={analyzingId === r.variantId}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
