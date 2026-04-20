import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../App.jsx';
import {
  Button, Alert, StatusBadge, Table, EmptyState, FilterChips,
  SearchInput, PageHeader, Tabs, formatCurrency, formatPercent,
  marginColor, marginStatus, MarginBar, Skeleton, Badge, Card
} from '../components/UI.jsx';
import COGSImportModal from '../components/COGSImportModal.jsx';
import AlertsTab from '../components/AlertsTab.jsx';
import { AIAnalysisRow, ProductDetailPanel, loadSavedAnalyses } from '../components/ProductDetailComponents.jsx';
import RecommendationsTab from '../components/RecommendationsTab.jsx';

/* ─── Cost Edit Modal ─── */
function CostEditModal({ product, onSave, onClose }) {
  const [cost, setCost] = useState(product.cost != null ? String(product.cost) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const targetCost60 = product.price ? (product.price * 0.4).toFixed(2) : null;
  const previewMargin = cost && product.price > 0
    ? (((product.price - parseFloat(cost)) / product.price) * 100).toFixed(1)
    : null;

  const handleSave = async () => {
    const num = parseFloat(cost);
    if (isNaN(num) || num < 0) { setError('Enter a valid cost.'); return; }
    if (num >= product.price) { setError(`Cost can't be ≥ price (${formatCurrency(product.price)}).`); return; }
    setSaving(true);
    try {
      await onSave(num);
      onClose();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const mc = previewMargin != null ? marginColor(parseFloat(previewMargin)) : null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(26,20,10,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24, animation: 'fadeIn 0.15s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 380, boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.2s ease' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="font-display" style={{ fontSize: '15px', fontWeight: 700 }}>Set cost</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.productTitle}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, padding: '0 2px' }}>×</button>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && <div style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--red-bg)', border: '1px solid var(--red-border)', fontSize: '13px', color: 'var(--red)' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 2 }}>Current price</div>
              <div className="mono" style={{ fontSize: '15px', fontWeight: 600 }}>{formatCurrency(product.price)}</div>
            </div>
            {targetCost60 && (
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 12 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 2 }}>Max cost for 60% margin</div>
                <div className="mono" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--green)' }}>{formatCurrency(parseFloat(targetCost60))}</div>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
              Cost of goods (COGS)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>$</span>
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={cost}
                onChange={e => { setCost(e.target.value); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
                placeholder="0.00"
                style={{ width: '100%', padding: '9px 12px 9px 24px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '15px', fontFamily: "'JetBrains Mono', monospace", outline: 'none', transition: 'var(--transition)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-subtle)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {previewMargin != null && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: mc === 'var(--green)' ? 'var(--green-bg)' : mc === 'var(--yellow)' ? 'var(--yellow-bg)' : 'var(--red-bg)', border: `1px solid ${mc === 'var(--green)' ? 'var(--green-border)' : mc === 'var(--yellow)' ? 'var(--yellow-border)' : 'var(--red-border)'}` }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Margin at this cost: </span>
              <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: mc }}>{previewMargin}%</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button variant="secondary" size="md" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
            <Button size="md" loading={saving} onClick={handleSave} style={{ flex: 1 }}>Save cost</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Products Tab ─── */
function ProductsTab({ products, loading, onCostSaved, saving, isPro }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [costModal, setCostModal] = useState(null);
  const [expandedAI, setExpandedAI] = useState({});
  const [expandedDetail, setExpandedDetail] = useState({});
  const [analyses, setAnalyses] = useState(loadSavedAnalyses);

  const handleAnalyzed = (variantId, text) => {
    setAnalyses(prev => ({ ...prev, [variantId]: { text, savedAt: Date.now() } }));
  };

  const counts = {
    all: products.length,
    healthy: products.filter(p => p.marginPercent >= 60).length,
    low: products.filter(p => p.marginPercent >= 40 && p.marginPercent < 60).length,
    losing: products.filter(p => p.marginPercent != null && p.marginPercent < 40).length,
    missing: products.filter(p => p.cost == null).length,
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.productTitle?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    const matchFilter =
      filter === 'all' ? true :
      filter === 'healthy' ? p.marginPercent >= 60 :
      filter === 'low' ? (p.marginPercent >= 40 && p.marginPercent < 60) :
      filter === 'losing' ? (p.marginPercent != null && p.marginPercent < 40) :
      filter === 'missing' ? p.cost == null : true;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search products or SKU…" />
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { label: 'All', value: 'all', count: counts.all },
            { label: 'Healthy', value: 'healthy', count: counts.healthy },
            { label: 'Low margin', value: 'low', count: counts.low },
            { label: 'Losing', value: 'losing', count: counts.losing },
            { label: 'No cost', value: 'missing', count: counts.missing },
          ]}
        />
      </div>

      {loading ? (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface)' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ padding: '14px 16px', borderBottom: i < 5 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', gap: 16, alignItems: 'center' }}>
              <Skeleton height={12} width="28%" />
              <Skeleton height={12} width="12%" />
              <Skeleton height={12} width="12%" />
              <Skeleton height={12} width="12%" />
              <Skeleton height={12} width="20%" />
              <Skeleton height={12} width="10%" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📦" title={search || filter !== 'all' ? 'No matching products' : 'No products yet'} description={search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Sync your store to import products.'} />
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface)' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1.5fr 1fr 120px', gap: 0, padding: '8px 16px', background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
            {['Product', 'SKU', 'Price', 'Cost', 'Margin', 'Status', ''].map(h => (
              <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>
          {filtered.map((p, i) => {
            const isExpanded = expandedAI[p.id];
            const isDetailExpanded = expandedDetail[p.id];
            return (
              <div key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1.5fr 1fr 120px', gap: 0, padding: '11px 16px', transition: 'background 0.15s ease', cursor: 'default', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  {/* Product name — click to expand details */}
                  <div style={{ minWidth: 0 }}>
                    <button
                      onClick={() => setExpandedDetail(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      title="View margin trend and cost history"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}
                    >
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: isDetailExpanded ? 'var(--accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.productTitle}</div>
                    </button>
                    {p.variantTitle && p.variantTitle !== 'Default' && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{p.variantTitle}</div>}
                  </div>
                  {/* SKU */}
                  <div className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.sku || '—'}</div>
                  {/* Price */}
                  <div className="mono" style={{ fontSize: '13.5px', fontWeight: 500 }}>{formatCurrency(p.price)}</div>
                  {/* Cost — click to edit */}
                  <button
                    onClick={() => setCostModal(p)}
                    title="Click to edit cost"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 5, padding: '3px 6px', borderRadius: 5, transition: 'var(--transition)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="mono" style={{ fontSize: '13px', color: p.cost != null ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: '1px dashed var(--border)' }}>
                      {p.cost != null ? formatCurrency(p.cost) : 'Set cost'}
                    </span>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                      <path d="M1.5 9.5h2l5-5-2-2-5 5v2zM8 2l1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {/* Margin bar */}
                  <div>{p.cost != null ? <MarginBar pct={p.marginPercent} width={100} /> : <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>}</div>
                  {/* Status badge */}
                  <div>
                    <StatusBadge variant={p.cost == null ? 'missing_cost' : marginStatus(p.marginPercent)} />
                  </div>
                  {/* AI toggle + Details */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                    <button
                      onClick={() => setExpandedAI(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      title="AI Analysis"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 8px', borderRadius: 5, fontSize: '11.5px', fontWeight: 600,
                        background: isExpanded ? 'var(--accent-subtle)' : 'transparent',
                        border: isExpanded ? '1px solid var(--accent-border)' : '1px solid transparent',
                        color: isExpanded ? 'var(--accent)' : analyses[p.id] ? 'var(--green)' : 'var(--text-muted)',
                        cursor: 'pointer', transition: 'var(--transition)',
                      }}
                      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1.5l.8 1.7 1.9.3-1.4 1.3.3 1.9L6 5.8l-1.6.9.3-1.9L3.3 3.5l1.9-.3L6 1.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
                        <path d="M2 10l1.2-.6M10 10l-1.2-.6M6 9v1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                      </svg>
                      AI
                    </button>
                  </div>
                </div>
                {/* Detail panel (margin trend / cost history) */}
                {isDetailExpanded && <ProductDetailPanel product={p} />}
                {/* AI analysis row */}
                {isExpanded && (
                  <AIAnalysisRow
                    variantId={p.id}
                    productTitle={p.productTitle}
                    isPro={isPro}
                    analyses={analyses}
                    onAnalyzed={handleAnalyzed}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ marginTop: 8, fontSize: '12px', color: 'var(--text-muted)' }}>
          {filtered.length} of {products.length} products · Click product name to view trend · Click cost to edit · Click AI to analyze
        </div>
      )}

      {costModal && (
        <CostEditModal
          product={costModal}
          onSave={async (cost) => {
            await onCostSaved(costModal.id, cost);
          }}
          onClose={() => setCostModal(null)}
        />
      )}
    </div>
  );
}

/* ─── CSV Export ─── */
function exportProductsCSV(products) {
  const header = 'Product,SKU,Price,COGS,Margin %,Units Sold 30d,Revenue 30d';
  const rows = products.map(p => [
    `"${(p.productTitle || '').replace(/"/g, '""')}"`,
    p.sku || '',
    p.price != null ? p.price.toFixed(2) : '',
    p.cost != null ? p.cost.toFixed(2) : '',
    p.marginPercent != null ? p.marginPercent.toFixed(1) : '',
    p.unitsSold30d ?? '',
    p.revenue30d != null ? p.revenue30d.toFixed(2) : '',
  ].join(','));
  const csv = [header, ...rows].join('\n');
  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `margin-pilot-products-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── COGS Help Tooltip ─── */
function COGSHelpTooltip() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setVisible(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        style={{
          width: 18, height: 18, borderRadius: '50%', border: '1.5px solid var(--border)',
          background: visible ? 'var(--surface-raised)' : 'var(--surface)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', lineHeight: 1,
          transition: 'var(--transition)', flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={e => { if (!visible) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
        aria-label="What is COGS?"
      >
        ?
      </button>
      {visible && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 300,
          width: 280, padding: '12px 14px', borderRadius: 'var(--radius-lg)',
          background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
          fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontSize: '13.5px' }}>What is COGS?</div>
          COGS (Cost of Goods Sold) is what you pay your supplier for each product — not the price you charge customers.
          <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: '12px' }}>
            Import a CSV with <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>sku</span> and <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>cost</span> columns to set costs in bulk, or sync from Shopify product metafields.
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main ─── */
export default function ProductsPage() {
  const { user, sync, syncing } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState({});
  const [cogsModalOpen, setCogsModalOpen] = useState(false);
  const isPro = user?.plan === 'pro';

  const tabFromUrl = searchParams.get('tab') || 'products';
  const [tab, setTab] = useState(tabFromUrl === 'recommendations' ? 'recommendations' : 'products');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/products');
      setProducts(data.products || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCostSaved = async (variantId, cost) => {
    await api.put(`/api/products/${variantId}/cost`, { cogs: cost });
    setProducts(prev => prev.map(p => {
      if (p.id !== variantId) return p;
      const marginPercent = p.price > 0 ? ((p.price - cost) / p.price) * 100 : null;
      return { ...p, cost, marginPercent, status: marginStatus(marginPercent) };
    }));
  };

  const handleSyncAndReload = async () => {
    await sync();
    await load();
  };

  const missingCost = products.filter(p => p.cost == null).length;
  const recsCount = products.filter(p => p.cost != null && p.marginPercent < 60).length;

  return (
    <div className="page-content">
      <PageHeader
        title="Products"
        subtitle="Manage costs, track margins, and optimize prices"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => exportProductsCSV(products)}>
              Export CSV
            </Button>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Button variant="secondary" size="sm" onClick={() => setCogsModalOpen(true)}>
                Import COGS
              </Button>
              <COGSHelpTooltip />
            </div>
            <Button variant="secondary" size="sm" loading={syncing} onClick={handleSyncAndReload}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M11.5 2.5A5.5 5.5 0 0 0 1 6.5M1.5 10.5A5.5 5.5 0 0 0 12 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M11 0.5v2.5H8.5M2 12.5v-2.5H4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sync
            </Button>
          </div>
        }
      />

      {error && <div style={{ marginBottom: 14 }}><Alert type="error" message={error} onDismiss={() => setError('')} /></div>}

      <Tabs
        tabs={[
          { id: 'products', label: 'Products', count: products.length },
          { id: 'recommendations', label: 'Recommendations', count: recsCount || undefined },
          { id: 'alerts', label: 'Alerts' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'products' && (
        <ProductsTab
          products={products}
          loading={loading}
          onCostSaved={handleCostSaved}
          saving={saving}
          isPro={isPro}
        />
      )}
      {tab === 'recommendations' && (
        <RecommendationsTab products={products} loading={loading} isPro={isPro} />
      )}
      {tab === 'alerts' && (
        <AlertsTab products={products} />
      )}

      <COGSImportModal
        isOpen={cogsModalOpen}
        onClose={() => setCogsModalOpen(false)}
        onImported={load}
      />
    </div>
  );
}
