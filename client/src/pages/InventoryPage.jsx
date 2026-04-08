import { useState, useEffect } from 'react';
import api from '../api.js';
import { useAuth } from '../App.jsx';
import {
  Button, Alert, StatusBadge, Table, EmptyState, Modal,
  PageHeader, formatCurrency, Skeleton, LoadingSpinner
} from '../components/UI.jsx';

function inventoryStatus(row) {
  const qty = row.inventoryQuantity;
  const dailySales = row.dailySalesRate || 0;
  if (qty == null) return { variant: 'missing_cost', label: 'Unknown' };
  if (qty === 0) return { variant: 'losing', label: 'Out of stock' };
  if (dailySales > 0) {
    const daysLeft = qty / dailySales;
    if (daysLeft <= 7) return { variant: 'losing', label: 'Critical' };
    if (daysLeft <= 21) return { variant: 'low', label: 'Low stock' };
    if (daysLeft > 180) return { variant: 'overstock', label: 'Overstock' };
  }
  if (qty < 5) return { variant: 'low', label: 'Low stock' };
  return { variant: 'healthy', label: 'Healthy' };
}

function AIAnalysisModal({ variantId, productTitle, isOpen, onClose, isPro }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!isOpen || !isPro) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setText('');
      setDisplayed('');
      try {
        const data = await api.post(`/api/ai/inventory/${variantId}`);
        if (!cancelled) setText(data.analysis || data.text || '');
      } catch {
        if (!cancelled) setText('Unable to generate analysis. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [isOpen, variantId, isPro]);

  useEffect(() => {
    if (!text) return;
    let i = 0;
    const timer = setInterval(() => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 10);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`AI Analysis · ${productTitle}`}>
      {!isPro ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>✦</div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 20 }}>
            AI inventory analysis requires a Pro subscription.
          </p>
          <Button onClick={() => window.location.href = '/pricing'}>Upgrade to Pro</Button>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton height={12} />
          <Skeleton height={12} width="85%" />
          <Skeleton height={12} width="70%" />
          <div style={{ height: 8 }} />
          <Skeleton height={12} width="90%" />
          <Skeleton height={12} width="60%" />
        </div>
      ) : (
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {displayed}
          {displayed.length < text.length && (
            <span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--accent)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />
          )}
        </div>
      )}
    </Modal>
  );
}

export default function InventoryPage() {
  const { user, sync, syncing } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiModal, setAiModal] = useState(null);
  const isPro = user?.plan === 'pro';

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/inventory');
      setInventory(data.inventory || data.variants || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const criticalItems = inventory.filter(i => {
    const s = inventoryStatus(i);
    return s.label === 'Critical' || s.label === 'Out of stock';
  });

  const columns = [
    {
      key: 'product',
      header: 'Product',
      skeletonWidth: '75%',
      render: (row) => (
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {row.productTitle || row.title}
          </div>
          {row.variantTitle && row.variantTitle !== 'Default Title' && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 1 }}>{row.variantTitle}</div>
          )}
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      skeletonWidth: '55%',
      render: (row) => <span className="mono" style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{row.sku || '—'}</span>,
    },
    {
      key: 'qty',
      header: 'Qty',
      align: 'right',
      skeletonWidth: '40%',
      render: (row) => (
        <span className="mono" style={{ fontSize: '14px', fontWeight: 600, color: row.inventoryQuantity === 0 ? 'var(--red)' : 'var(--text-primary)' }}>
          {row.inventoryQuantity ?? '—'}
        </span>
      ),
    },
    {
      key: 'dailySales',
      header: 'Daily Sales',
      align: 'right',
      skeletonWidth: '40%',
      render: (row) => (
        <span className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {row.dailySalesRate != null ? row.dailySalesRate.toFixed(1) : '—'}
        </span>
      ),
    },
    {
      key: 'daysLeft',
      header: 'Days of Stock',
      align: 'right',
      skeletonWidth: '40%',
      render: (row) => {
        if (!row.dailySalesRate || row.inventoryQuantity == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        const days = Math.floor(row.inventoryQuantity / row.dailySalesRate);
        const color = days <= 7 ? 'var(--red)' : days <= 21 ? 'var(--yellow)' : 'var(--text-secondary)';
        return <span className="mono" style={{ fontSize: '13px', fontWeight: 500, color }}>{days}d</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      skeletonWidth: '55%',
      render: (row) => {
        const s = inventoryStatus(row);
        return <StatusBadge custom={{ label: s.label, color: s.variant === 'healthy' ? 'var(--green)' : s.variant === 'overstock' ? 'var(--yellow)' : s.variant === 'low' ? 'var(--yellow)' : 'var(--red)', bg: s.variant === 'healthy' ? 'var(--green-bg)' : 'var(--red-bg)', border: s.variant === 'healthy' ? 'var(--green-border)' : 'var(--red-border)' }} />;
      },
    },
    {
      key: 'actions',
      header: '',
      skeletonWidth: '30%',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAiModal({ id: row.id, title: row.productTitle || row.title })}
          style={{ gap: 5 }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1.5l1 2.2 2.5.4-1.8 1.8.4 2.6L6.5 7.4l-2.1 1.1.4-2.6L3 4.1l2.5-.4 1-2.2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          AI
        </Button>
      ),
    },
  ];

  return (
    <div className="page-content">
      <PageHeader
        title="Inventory"
        subtitle="Stock levels, turnover rates, and reorder alerts"
        actions={
          <Button variant="secondary" size="sm" loading={syncing} onClick={async () => { await sync(); load(); }}>
            Sync
          </Button>
        }
      />

      {error && (
        <div style={{ marginBottom: 16 }}>
          <Alert type="error" message={error} onDismiss={() => setError('')} />
        </div>
      )}

      {/* Critical alerts */}
      {!loading && criticalItems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          <div className="font-display" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>
            Reorder needed · {criticalItems.length} item{criticalItems.length !== 1 ? 's' : ''}
          </div>
          {criticalItems.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--red-bg)', border: '1px solid var(--red-border)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v5M7 9.5v1" stroke="var(--red)" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M2 12L7 2l5 10H2z" stroke="var(--red)" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--red)' }}>
                {item.productTitle || item.title}
              </span>
              <span className="mono" style={{ fontSize: '12.5px', color: 'var(--red)', opacity: 0.8 }}>
                {item.inventoryQuantity} units remaining
              </span>
            </div>
          ))}
        </div>
      )}

      <Table
        columns={columns}
        data={inventory}
        loading={loading}
        rowKey="id"
        emptyState={
          <EmptyState
            icon="📦"
            title="No inventory data"
            description="Sync your store to see stock levels and reorder alerts."
            action={<Button onClick={() => { sync(); load(); }} loading={syncing}>Sync now</Button>}
          />
        }
      />

      {aiModal && (
        <AIAnalysisModal
          variantId={aiModal.id}
          productTitle={aiModal.title}
          isOpen
          onClose={() => setAiModal(null)}
          isPro={isPro}
        />
      )}
    </div>
  );
}
