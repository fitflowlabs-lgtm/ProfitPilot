import { useState, useEffect } from 'react'
import { api } from '../api'
import { StatusBadge, MetricCard, Loading, AICard, AIButton } from '../components/UI'

export default function InventoryPage({ shop, refreshKey }) {
  const [data, setData] = useState(null)
  const [aiModal, setAiModal] = useState(null)
  const [analyzingId, setAnalyzingId] = useState(null)

  useEffect(() => {
    api.inventory(shop).then(setData)
  }, [shop, refreshKey])

  if (!data) return <Loading />

  const { summary, items } = data

  const handleAI = async (variantId) => {
    setAnalyzingId(variantId)
    setAiModal({ loading: true, text: '' })
    try {
      const r = await api.aiInventory(shop, variantId)
      setAiModal({ loading: false, text: r.analysis })
    } catch (e) {
      setAiModal({ loading: false, text: 'Failed to get analysis.' })
    }
    setAnalyzingId(null)
  }

  return (
    <div className="page">
      <div className="metrics-row animate-in">
        <MetricCard label="SKUs Tracked" value={summary.total} color="accent" />
        <MetricCard label="Urgent Reorders" value={summary.urgentReorders} sub="< 7 days left" color="red" />
        <MetricCard label="Reorder Soon" value={summary.reorderSoon} sub="7–14 days left" color="yellow" />
        <MetricCard label="Overstock Risk" value={summary.overstockRisks} sub="> 60 days stock" color="yellow" />
        <MetricCard label="Healthy" value={summary.healthyInventory} color="green" />
      </div>

      {aiModal && (
        <AICard label="AI Inventory Analysis" loading={aiModal.loading} onClose={() => setAiModal(null)}>
          {aiModal.text}
        </AICard>
      )}

      <div className="panel animate-in delay-1">
        <div className="panel-header">
          <span className="panel-title">Inventory Health</span>
        </div>
        <div className="panel-body flush">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-right">Stock</th>
                <th className="text-right">Sold (30d)</th>
                <th className="text-right">Daily Velocity</th>
                <th className="text-right">Seasonality</th>
                <th className="text-right">Days Left</th>
                <th className="text-right">Reorder Qty</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const daysColor = item.daysOfInventory == null ? undefined
                  : item.daysOfInventory < 7 ? 'var(--red)'
                  : item.daysOfInventory < 14 ? 'var(--yellow)'
                  : item.daysOfInventory > 60 ? 'var(--yellow)'
                  : 'var(--green)'

                return (
                  <tr key={item.id}>
                    <td>
                      <span className="product-name">{item.productTitle}</span>
                      <br /><span className="variant-name">{item.sku}</span>
                    </td>
                    <td className="text-right mono">{item.inventory}</td>
                    <td className="text-right mono">{item.unitsSold30}</td>
                    <td className="text-right mono">{item.dailySales}</td>
                    <td className="text-right mono">{item.seasonalMultiplier}x</td>
                    <td className="text-right mono" style={{ color: daysColor, fontWeight: item.status === 'urgent' ? 600 : undefined }}>
                      {item.daysOfInventory ?? '∞'}
                    </td>
                    <td className="text-right mono" style={{ color: item.reorderQty > 0 ? 'var(--red)' : undefined, fontWeight: item.reorderQty > 0 ? 600 : undefined }}>
                      {item.reorderQty || '—'}
                    </td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>
                      <AIButton
                        onClick={() => handleAI(item.id)}
                        loading={analyzingId === item.id}
                      />
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
