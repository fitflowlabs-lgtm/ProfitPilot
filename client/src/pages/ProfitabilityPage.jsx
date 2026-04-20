import { useState, useEffect } from 'react';
import api from '../api.js';
import { PageHeader, Alert, Table, EmptyState, formatCurrency, formatPercent, marginColor } from '../components/UI.jsx';

export default function ProfitabilityPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/reports/profitability')
      .then(d => setRows(d.products || d.rows || d || []))
      .catch(e => setError(e.message || 'Failed to load profitability data.'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      key: 'rank', header: '#', skeletonWidth: '20%',
      render: (r, i) => <span style={{ fontFamily: 'monospace', fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</span>,
    },
    {
      key: 'productTitle', header: 'Product', skeletonWidth: '60%',
      render: r => (
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.productTitle || r.title}</div>
          {r.sku && r.sku !== 'Default' && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.sku}</div>}
        </div>
      ),
    },
    {
      key: 'unitsSold', header: 'Units sold', align: 'right', skeletonWidth: '35%',
      render: r => <span style={{ fontFamily: 'monospace', fontSize: '13.5px', color: 'var(--text-secondary)' }}>{(r.unitsSold ?? r.unitsSold30d ?? '—').toLocaleString?.() ?? r.unitsSold ?? r.unitsSold30d ?? '—'}</span>,
    },
    {
      key: 'revenue', header: 'Revenue', align: 'right', skeletonWidth: '40%',
      render: r => <span style={{ fontFamily: 'monospace', fontSize: '13.5px', color: 'var(--text-primary)' }}>{formatCurrency(r.revenue ?? r.revenue30d)}</span>,
    },
    {
      key: 'grossProfit', header: 'Gross profit', align: 'right', skeletonWidth: '40%',
      render: r => {
        const gp = r.grossProfit ?? r.profit;
        const mc = marginColor(r.marginPercent);
        return <span style={{ fontFamily: 'monospace', fontSize: '13.5px', fontWeight: 600, color: mc }}>{formatCurrency(gp)}</span>;
      },
    },
    {
      key: 'marginPercent', header: 'Margin %', align: 'right', skeletonWidth: '35%',
      render: r => {
        const mc = marginColor(r.marginPercent);
        return <span style={{ fontFamily: 'monospace', fontSize: '13.5px', fontWeight: 700, color: mc }}>{formatPercent(r.marginPercent)}</span>;
      },
    },
  ];

  // Inject row index for rank column
  const columnsWithIndex = columns.map(col => ({
    ...col,
    render: col.key === 'rank' ? (r) => {
      const idx = rows.findIndex(x => x === r);
      return <span style={{ fontFamily: 'monospace', fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 700 }}>{idx + 1}</span>;
    } : col.render,
  }));

  return (
    <div className="page-content">
      <PageHeader title="Product Profitability" subtitle="Full ranking by gross profit and margin" />

      {error && <div style={{ marginBottom: 16 }}><Alert type="error" message={error} onDismiss={() => setError('')} /></div>}

      <Table
        columns={columnsWithIndex}
        data={rows}
        loading={loading}
        rowKey="id"
        emptyState={
          <EmptyState
            icon="📊"
            title="No profitability data"
            description="Sync your store and ensure products have COGS set."
          />
        }
      />
    </div>
  );
}
