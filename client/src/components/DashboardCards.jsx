import { useState, useEffect } from 'react';
import api from '../api.js';
import { Card, Alert, Skeleton, formatCurrency, formatPercent, marginColor } from './UI.jsx';

/* ─── Break-even Calculator ─── */
export function BreakEvenCard({ products }) {
  const FIXED_COSTS_KEY = 'mp_fixed_costs';
  const [fixedCosts, setFixedCosts] = useState(() => {
    try { return parseFloat(localStorage.getItem(FIXED_COSTS_KEY) || '0') || 0; } catch { return 0; }
  });
  const [inputVal, setInputVal] = useState(() => {
    try { return localStorage.getItem(FIXED_COSTS_KEY) || ''; } catch { return ''; }
  });

  const handleChange = (v) => {
    setInputVal(v);
    const n = parseFloat(v);
    if (!isNaN(n) && n >= 0) {
      setFixedCosts(n);
      try { localStorage.setItem(FIXED_COSTS_KEY, String(n)); } catch { /* ignore */ }
    }
  };

  const rows = (products || [])
    .filter(p => p.cost != null && p.price > 0)
    .map(p => ({
      ...p,
      contribution: p.price - p.cost,
      unitsNeeded: fixedCosts > 0 && (p.price - p.cost) > 0 ? Math.ceil(fixedCosts / (p.price - p.cost)) : null,
    }))
    .filter(r => r.contribution > 0)
    .sort((a, b) => (a.unitsNeeded || Infinity) - (b.unitsNeeded || Infinity));

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div className="font-display" style={{ fontSize: '14px', fontWeight: 700 }}>Break-even Calculator</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Monthly fixed costs</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px' }}>$</span>
            <input
              type="number"
              min={0}
              value={inputVal}
              onChange={e => handleChange(e.target.value)}
              placeholder="0"
              style={{ width: 120, padding: '6px 10px 6px 20px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '13.5px', fontFamily: 'monospace', background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none' }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
            />
          </div>
        </div>
      </div>

      {fixedCosts === 0 ? (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>Enter your monthly fixed costs to see how many units each product needs to sell to break even.</div>
      ) : rows.length === 0 ? (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No products with COGS set. Add costs in Products.</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: 460 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Product', 'Price', 'COGS', 'Contribution/unit', 'Units to break even'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: h === 'Product' ? 'left' : 'right', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r, i) => (
                  <tr key={r.id || i} style={{ borderBottom: i < Math.min(rows.length, 10) - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{r.productTitle}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{formatCurrency(r.price)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{formatCurrency(r.cost)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: 'var(--green)' }}>{formatCurrency(r.contribution)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: r.unitsNeeded != null ? 'var(--accent)' : 'var(--text-muted)' }}>{r.unitsNeeded != null ? r.unitsNeeded.toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic' }}>
            Estimates only. Assumes fixed costs are fully allocated. Consult your accountant for official financials.
          </div>
        </>
      )}
    </Card>
  );
}

/* ─── P&L Summary ─── */
export function PnLCard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/reports/pnl?months=6')
      .then(d => setRows(d.months || d.rows || d || []))
      .catch(e => setError(e.message || 'Could not load P&L data.'))
      .finally(() => setLoading(false));
  }, []);

  const marginPctColor = (m) => {
    if (m == null) return 'var(--text-muted)';
    if (m >= 40) return 'var(--green)';
    if (m >= 20) return 'var(--yellow)';
    return 'var(--red)';
  };

  return (
    <Card style={{ marginBottom: 20 }}>
      <div className="font-display" style={{ fontSize: '14px', fontWeight: 700, marginBottom: 16 }}>P&L Summary · Last 6 months</div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} height={36} />)}
        </div>
      ) : error ? (
        <div style={{ fontSize: '13px', color: 'var(--red)' }}>{error}</div>
      ) : rows.length === 0 ? (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No P&L data available yet.</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: 460 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Month', 'Revenue', 'Est. COGS', 'Gross Profit', 'Margin %'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: h === 'Month' ? 'left' : 'right', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const mc = marginPctColor(r.marginPercent ?? r.margin);
                  return (
                    <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.month || r.label || '—'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{formatCurrency(r.revenue)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{formatCurrency(r.cogs ?? r.estimatedCogs)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: (r.grossProfit ?? r.profit ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatCurrency(r.grossProfit ?? r.profit)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: mc }}>{formatPercent(r.marginPercent ?? r.margin)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic' }}>
            Estimates only. Consult your accountant for official financials.
          </div>
        </>
      )}
    </Card>
  );
}
