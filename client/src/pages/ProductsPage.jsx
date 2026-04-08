import { useState, useEffect } from 'react';
import api from '../api.js';
import {
  Button, Alert, StatusBadge, Table, EmptyState, FilterChips,
  SearchInput, InlineEditCell, PageHeader, formatCurrency, formatPercent,
  marginStatus, MarginBar
} from '../components/UI.jsx';
import { useAuth } from '../App.jsx';

export default function ProductsPage({ embedded }) {
  const { sync, syncing } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/products');
      setProducts(data.variants || data.products || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSyncAndReload = async () => {
    await sync();
    await load();
  };

  const handleCostSave = async (variantId, cost) => {
    setSaving(s => ({ ...s, [variantId]: true }));
    try {
      await api.put(`/api/products/${variantId}/cost`, { cost });
      setProducts(prev => prev.map(p => p.id === variantId ? { ...p, cost, margin: cost > 0 ? ((p.price - cost) / p.price) * 100 : null } : p));
      setSuccessMsg('Cost updated.');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(s => ({ ...s, [variantId]: false }));
    }
  };

  // Filtered data
  const counts = {
    all: products.length,
    healthy: products.filter(p => p.margin >= 60).length,
    low: products.filter(p => p.margin >= 40 && p.margin < 60).length,
    losing: products.filter(p => p.margin != null && p.margin < 40).length,
    missing: products.filter(p => p.margin == null || p.cost == null).length,
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.productTitle?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.title?.toLowerCase().includes(q);
    const matchFilter =
      filter === 'all' ? true :
      filter === 'healthy' ? p.margin >= 60 :
      filter === 'low' ? (p.margin >= 40 && p.margin < 60) :
      filter === 'losing' ? (p.margin != null && p.margin < 40) :
      filter === 'missing' ? (p.margin == null || p.cost == null) : true;
    return matchSearch && matchFilter;
  });

  const columns = [
    {
      key: 'product',
      header: 'Product',
      skeletonWidth: '80%',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {row.productTitle || row.title || 'Unnamed product'}
          </span>
          {row.variantTitle && row.variantTitle !== 'Default Title' && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.variantTitle}</span>
          )}
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      skeletonWidth: '60%',
      render: (row) => (
        <span className="mono" style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          {row.sku || '—'}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      skeletonWidth: '50%',
      render: (row) => (
        <span className="mono" style={{ fontSize: '13.5px', fontWeight: 500 }}>
          {formatCurrency(row.price)}
        </span>
      ),
    },
    {
      key: 'cost',
      header: 'Cost (COGS)',
      align: 'right',
      skeletonWidth: '50%',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {saving[row.id] ? (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Saving…</span>
          ) : (
            <InlineEditCell
              value={row.cost}
              onSave={v => handleCostSave(row.id, v)}
              format={formatCurrency}
              placeholder="Set cost"
            />
          )}
        </div>
      ),
    },
    {
      key: 'margin',
      header: 'Margin',
      skeletonWidth: '70%',
      render: (row) => {
        if (row.cost == null) return <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>—</span>;
        return <MarginBar pct={row.margin} />;
      },
    },
    {
      key: 'status',
      header: 'Status',
      skeletonWidth: '60%',
      render: (row) => (
        <StatusBadge variant={row.cost == null ? 'missing_cost' : marginStatus(row.margin)} />
      ),
    },
    {
      key: 'inventory',
      header: 'Stock',
      align: 'right',
      skeletonWidth: '40%',
      render: (row) => (
        <span className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {row.inventoryQuantity ?? '—'}
        </span>
      ),
    },
  ];

  return (
    <div className={embedded ? '' : 'page-content'}>
      {!embedded && (
        <PageHeader
          title="Products"
          subtitle="Manage costs and track margins across your catalog"
          actions={
            <Button variant="secondary" size="sm" loading={syncing} onClick={handleSyncAndReload}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M11.5 2.5A5.5 5.5 0 0 0 1 6.5M1.5 10.5A5.5 5.5 0 0 0 12 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M11 0.5v2.5H8.5M2 12.5v-2.5H4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sync
            </Button>
          }
        />
      )}

      {(error || successMsg) && (
        <div style={{ marginBottom: 14 }}>
          {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
          {successMsg && <Alert type="success" message={successMsg} />}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search products or SKU…" />
          <FilterChips
            value={filter}
            onChange={setFilter}
            options={[
              { label: 'All', value: 'all', count: counts.all },
              { label: 'Healthy', value: 'healthy', count: counts.healthy },
              { label: 'Low', value: 'low', count: counts.low },
              { label: 'Losing', value: 'losing', count: counts.losing },
              { label: 'No cost', value: 'missing', count: counts.missing },
            ]}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        emptyState={
          <EmptyState
            icon="📦"
            title={search || filter !== 'all' ? 'No matching products' : 'No products synced yet'}
            description={
              search || filter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Sync your Shopify store to import your product catalog.'
            }
            action={
              !search && filter === 'all' ? (
                <Button onClick={handleSyncAndReload} loading={syncing}>Sync products</Button>
              ) : null
            }
          />
        }
      />

      {!loading && filtered.length > 0 && (
        <div style={{ marginTop: 10, padding: '8px 4px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Showing {filtered.length} of {products.length} variants · Click a cost to edit it inline
        </div>
      )}
    </div>
  );
}
