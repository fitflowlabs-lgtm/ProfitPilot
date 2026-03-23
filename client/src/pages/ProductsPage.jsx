import { useState, useEffect } from 'react'
import { api } from '../api'
import { StatusBadge, Loading, formatCurrency, formatPercent, marginColor } from '../components/UI'

export default function ProductsPage({ shop, refreshKey }) {
  const [products, setProducts] = useState(null)
  const [editCosts, setEditCosts] = useState({})
  const [saving, setSaving] = useState({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.products(shop).then((d) => {
      setProducts(d.products)
      const costs = {}
      d.products.forEach((p) => { costs[p.id] = p.cost ?? '' })
      setEditCosts(costs)
    })
  }, [shop, refreshKey])

  if (!products) return <Loading />

  const filtered = products.filter((p) =>
    p.productTitle.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (variantId) => {
    const val = editCosts[variantId]
    if (val === '' || val === undefined) return
    setSaving((s) => ({ ...s, [variantId]: true }))
    try {
      const result = await api.updateCost(shop, variantId, Number(val))
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== variantId) return p
          const v = result.variant
          const profit = v.cost != null ? v.price - v.cost : null
          const marginPercent = v.cost != null && v.price > 0 ? (profit / v.price) * 100 : null
          let status = 'missing_cost'
          if (v.cost != null) {
            if (profit < 0) status = 'losing'
            else if (marginPercent < 40) status = 'low'
            else if (marginPercent < 60) status = 'okay'
            else status = 'good'
          }
          return { ...p, cost: v.cost, profit, marginPercent, status }
        })
      )
    } catch (e) {
      console.error(e)
    }
    setSaving((s) => ({ ...s, [variantId]: false }))
  }

  return (
    <div className="page">
      <div className="panel animate-in">
        <div className="panel-header">
          <span className="panel-title">All Products & Costs</span>
          <input
            className="inline-input"
            style={{ width: 220 }}
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="panel-body flush">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th className="text-right">Price</th>
                <th className="text-right">Cost (COGS)</th>
                <th className="text-right">Profit</th>
                <th className="text-right">Margin</th>
                <th className="text-right">Inventory</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td><span className="product-name">{p.productTitle}</span></td>
                  <td><span className="variant-name">{p.sku}</span></td>
                  <td className="text-right mono">{formatCurrency(p.price)}</td>
                  <td className="text-right">
                    <input
                      className="inline-input"
                      value={editCosts[p.id] ?? ''}
                      onChange={(e) => setEditCosts((c) => ({ ...c, [p.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSave(p.id)}
                      placeholder="Enter cost"
                    />
                  </td>
                  <td className="text-right mono" style={{ color: marginColor(p.marginPercent) }}>
                    {formatCurrency(p.profit)}
                  </td>
                  <td className="text-right mono" style={{ color: marginColor(p.marginPercent) }}>
                    {formatPercent(p.marginPercent)}
                  </td>
                  <td className="text-right mono">{p.inventoryQty ?? 0}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <button
                      className={`btn btn-sm ${p.status === 'missing_cost' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => handleSave(p.id)}
                      disabled={saving[p.id]}
                    >
                      {saving[p.id] ? '…' : 'Save'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
