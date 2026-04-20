import { useState, useEffect } from 'react';
import api from '../api.js';
import { useAuth } from '../App.jsx';
import { Button, Alert, StatusBadge, Table, EmptyState, Modal, PageHeader, Skeleton, Badge } from '../components/UI.jsx';

// Server returns: { id, productTitle, sku, inventory, unitsSold30, dailySales, daysOfInventory, reorderQty, recommendation, status }
function getStatusConfig(status) {
  switch (status) {
    case 'critical': return { label: 'Critical', color: 'var(--red)', bg: 'var(--red-bg)', border: 'var(--red-border)' };
    case 'low': return { label: 'Low stock', color: 'var(--yellow)', bg: 'var(--yellow-bg)', border: 'var(--yellow-border)' };
    case 'overstock': return { label: 'Overstock', color: 'var(--yellow)', bg: 'var(--yellow-bg)', border: 'var(--yellow-border)' };
    case 'out': return { label: 'Out of stock', color: 'var(--red)', bg: 'var(--red-bg)', border: 'var(--red-border)' };
    default: return { label: 'Healthy', color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)' };
  }
}

function AIInventoryModal({ variantId, productTitle, isOpen, onClose, isPro }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!isOpen || !isPro) return;
    let cancelled = false;
    setLoading(true);
    setText('');
    setDisplayed('');
    api.post(`/api/ai/inventory/${variantId}`)
      .then(data => { if (!cancelled) { setText(data.analysis || data.text || ''); } })
      .catch(() => { if (!cancelled) setText('Analysis failed. Please try again.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, variantId, isPro]);

  useEffect(() => {
    if (!text) return;
    let i = 0;
    const t = setInterval(() => {
      if (i <= text.length) { setDisplayed(text.slice(0, i)); i++; }
      else clearInterval(t);
    }, 10);
    return () => clearInterval(t);
  }, [text]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`AI Inventory Analysis · ${productTitle}`}>
      {!isPro ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 20 }}>AI inventory analysis requires a Pro subscription.</p>
          <Button onClick={() => window.location.href = '/pricing'}>Upgrade to Pro</Button>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[1, 0.85, 0.7, 0.95, 0.6].map((w, i) => (
            <div key={i} style={{ height: 11, borderRadius: 4, background: 'linear-gradient(90deg, var(--surface-raised) 0%, var(--surface-hover) 50%, var(--surface-raised) 100%)', backgroundSize: '400px 100%', animation: 'shimmer 1.4s ease-in-out infinite', width: `${w * 100}%` }} />
          ))}
        </div>
      ) : (
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {displayed}
          {displayed.length < text.length && <span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--accent)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />}
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
    setError('');
    try {
      const data = await api.get('/api/inventory');
      setInventory(data.items || []);
    } catch (e) {
      setError(e.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const critical = inventory.filter(i => i.status === 'critical' || i.status === 'out');

  const columns = [
    {
      key: 'product', header: 'Product', skeletonWidth: '75%',
      render: r => (
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.productTitle}</div>
          {r.sku && r.sku !== 'Default' && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{r.sku}</div>}
        </div>
      ),
    },
    {
      key: 'inventory', header: 'Qty', align: 'right', skeletonWidth: '35%',
      render: r => (
        <span className="mono" style={{ fontSize: '14px', fontWeight: 600, color: r.inventory === 0 ? 'var(--red)' : r.status === 'critical' ? 'var(--red)' : 'var(--text-primary)' }}>
          {r.inventory ?? '—'}
        </span>
      ),
    },
    {
      key: 'unitsSold30', header: 'Sold 30d', align: 'right', skeletonWidth: '35%',
      render: r => <span className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{r.unitsSold30 ?? '—'}</span>,
    },
    {
      key: 'dailySales', header: 'Daily rate', align: 'right', skeletonWidth: '35%',
      render: r => <span className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{r.dailySales != null ? r.dailySales.toFixed(1) : '—'}</span>,
    },
    {
      key: 'daysOfInventory', header: 'Days left', align: 'right', skeletonWidth: '35%',
      render: r => {
        if (r.daysOfInventory == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        const color = r.daysOfInventory <= 7 ? 'var(--red)' : r.daysOfInventory <= 21 ? 'var(--yellow)' : 'var(--text-secondary)';
        return <span className="mono" style={{ fontSize: '13px', fontWeight: 500, color }}>{r.daysOfInventory}d</span>;
      },
    },
    {
      key: 'status', header: 'Status', skeletonWidth: '55%',
      render: r => {
        const cfg = getStatusConfig(r.status);
        return <StatusBadge custom={cfg} />;
      },
    },
    {
      key: 'actions', header: '', skeletonWidth: '25%',
      render: r => (
        <Button variant="ghost" size="sm" onClick={() => setAiModal({ id: r.id, title: r.productTitle })} style={{ gap: 4, color: 'var(--text-muted)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1.5l.8 1.7 1.9.3-1.4 1.3.3 1.9L6 5.8l-1.6.9.3-1.9L3.3 3.5l1.9-.3L6 1.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
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

      {error && <div style={{ marginBottom: 16 }}><Alert type="error" message={error} onDismiss={() => setError('')} /></div>}

      {/* Critical alerts */}
      {!loading && critical.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Reorder needed · {critical.length} item{critical.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {critical.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--red-bg)', border: '1px solid var(--red-border)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v5M7 9.5v1" stroke="var(--red)" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M2 12L7 2l5 10H2z" stroke="var(--red)" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--red)' }}>{item.productTitle}</span>
                <span className="mono" style={{ fontSize: '12.5px', color: 'var(--red)', opacity: 0.8 }}>
                  {item.inventory} units · {item.recommendation}
                </span>
              </div>
            ))}
          </div>
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
            description="Sync your store to see stock levels and alerts."
            action={<Button onClick={() => { sync(); load(); }} loading={syncing}>Sync now</Button>}
          />
        }
      />

      {aiModal && (
        <AIInventoryModal
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
