import React, { useState, useRef, useEffect } from 'react';

/* ─── Formatters ─── */
export function formatCurrency(value) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value) {
  if (value == null || isNaN(value)) return '—';
  return `${Number(value).toFixed(1)}%`;
}

export function marginColor(pct) {
  if (pct == null) return 'var(--text-muted)';
  if (pct >= 60) return 'var(--green)';
  if (pct >= 40) return 'var(--yellow)';
  return 'var(--red)';
}

export function marginStatus(pct) {
  if (pct == null) return 'missing_cost';
  if (pct >= 60) return 'healthy';
  if (pct >= 40) return 'low';
  return 'losing';
}

/* ─── StatusBadge ─── */
const badgeConfig = {
  healthy: { label: 'Healthy', color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)' },
  low: { label: 'Low margin', color: 'var(--yellow)', bg: 'var(--yellow-bg)', border: 'var(--yellow-border)' },
  losing: { label: 'Losing money', color: 'var(--red)', bg: 'var(--red-bg)', border: 'var(--red-border)' },
  missing_cost: { label: 'No cost', color: 'var(--text-muted)', bg: 'var(--surface-raised)', border: 'var(--border)' },
  overstock: { label: 'Overstock', color: 'var(--yellow)', bg: 'var(--yellow-bg)', border: 'var(--yellow-border)' },
  critical: { label: 'Critical', color: 'var(--red)', bg: 'var(--red-bg)', border: 'var(--red-border)' },
};

export function StatusBadge({ variant, custom }) {
  const config = custom || badgeConfig[variant] || badgeConfig.missing_cost;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '11.5px',
      fontWeight: 600,
      letterSpacing: '0.01em',
      color: config.color,
      background: config.bg,
      border: `1px solid ${config.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: config.color,
        flexShrink: 0,
      }} />
      {config.label}
    </span>
  );
}

/* ─── Badge ─── */
export function Badge({ color = 'neutral', children, size = 'sm' }) {
  const colors = {
    green: { color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)' },
    yellow: { color: 'var(--yellow)', bg: 'var(--yellow-bg)', border: 'var(--yellow-border)' },
    red: { color: 'var(--red)', bg: 'var(--red-bg)', border: 'var(--red-border)' },
    accent: { color: 'var(--accent)', bg: 'var(--accent-subtle)', border: 'var(--accent-border)' },
    neutral: { color: 'var(--text-secondary)', bg: 'var(--surface-raised)', border: 'var(--border)' },
  };
  const c = colors[color] || colors.neutral;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'sm' ? '2px 7px' : '4px 10px',
      borderRadius: '4px',
      fontSize: size === 'sm' ? '11.5px' : '13px',
      fontWeight: 600,
      color: c.color,
      background: c.bg,
      border: `1px solid ${c.border}`,
    }}>
      {children}
    </span>
  );
}

/* ─── Button ─── */
export function Button({ variant = 'primary', size = 'md', loading, disabled, children, onClick, type = 'button', style: extraStyle, className }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'var(--transition)',
    borderRadius: 'var(--radius)',
    border: '1px solid transparent',
    outline: 'none',
    whiteSpace: 'nowrap',
  };

  const sizes = {
    sm: { padding: '5px 12px', fontSize: '12.5px' },
    md: { padding: '8px 16px', fontSize: '13.5px' },
    lg: { padding: '11px 22px', fontSize: '14px' },
  };

  const variants = {
    primary: {
      background: 'var(--accent)',
      color: '#fff',
      borderColor: 'var(--accent)',
    },
    secondary: {
      background: 'var(--surface)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border)',
      boxShadow: 'var(--shadow-sm)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      borderColor: 'transparent',
    },
    danger: {
      background: 'var(--red-bg)',
      color: 'var(--red)',
      borderColor: 'var(--red-border)',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      style={{ ...base, ...sizes[size], ...variants[variant], ...extraStyle }}
      onMouseEnter={e => {
        if (!disabled && !loading) {
          if (variant === 'primary') e.currentTarget.style.background = 'var(--accent-hover)';
          else if (variant === 'secondary') e.currentTarget.style.background = 'var(--surface-hover)';
          else if (variant === 'ghost') e.currentTarget.style.background = 'var(--surface-hover)';
        }
      }}
      onMouseLeave={e => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = variants[variant].background;
        }
      }}
    >
      {loading ? (
        <>
          <LoadingSpinner size={14} color={variant === 'primary' ? '#fff' : 'var(--accent)'} />
          {children}
        </>
      ) : children}
    </button>
  );
}

/* ─── Card ─── */
export function Card({ children, className, padding = 'md', style: extraStyle }) {
  const paddings = { sm: '16px', md: '24px', lg: '32px', none: '0' };
  return (
    <div
      className={className}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: paddings[padding],
        boxShadow: 'var(--shadow)',
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}

/* ─── MetricCard ─── */
export function MetricCard({ label, value, delta, subtext, icon, accent, loading }) {
  if (loading) {
    return (
      <Card style={{ minWidth: 0 }}>
        <Skeleton height={12} width="50%" style={{ marginBottom: 12 }} />
        <Skeleton height={28} width="70%" style={{ marginBottom: 8 }} />
        <Skeleton height={10} width="40%" />
      </Card>
    );
  }

  return (
    <Card style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </span>
        {icon && (
          <span style={{ color: accent ? 'var(--accent)' : 'var(--text-muted)', opacity: 0.7 }}>
            {icon}
          </span>
        )}
      </div>
      <div className="mono" style={{ fontSize: '24px', fontWeight: 500, color: accent || 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4, lineHeight: 1.1 }}>
        {value}
      </div>
      {delta !== undefined && delta !== null && (
        <div style={{ fontSize: '12px', color: delta >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}% vs last 30d
        </div>
      )}
      {subtext && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
          {subtext}
        </div>
      )}
    </Card>
  );
}

/* ─── Skeleton ─── */
export function Skeleton({ width, height = 16, style: extraStyle }) {
  return (
    <div style={{
      width: width || '100%',
      height,
      borderRadius: 4,
      background: 'linear-gradient(90deg, var(--surface-raised) 0%, var(--surface-hover) 50%, var(--surface-raised) 100%)',
      backgroundSize: '800px 100%',
      animation: 'shimmer 1.4s ease-in-out infinite',
      ...extraStyle,
    }} />
  );
}

/* ─── LoadingSpinner ─── */
export function LoadingSpinner({ size = 20, color = 'var(--accent)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
      <circle cx="10" cy="10" r="8" stroke={color} strokeOpacity="0.2" strokeWidth="2.5" />
      <path d="M10 2a8 8 0 0 1 8 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── EmptyState ─── */
export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', animation: 'fadeIn 0.3s ease' }}>
      {icon && (
        <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>{icon}</div>
      )}
      <div className="font-display" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>
          {description}
        </div>
      )}
      {action}
    </div>
  );
}

/* ─── Alert ─── */
export function Alert({ type = 'info', message, onDismiss }) {
  const config = {
    info: { color: 'var(--accent)', bg: 'var(--accent-subtle)', border: 'var(--accent-border)' },
    warning: { color: 'var(--yellow)', bg: 'var(--yellow-bg)', border: 'var(--yellow-border)' },
    error: { color: 'var(--red)', bg: 'var(--red-bg)', border: 'var(--red-border)' },
    success: { color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)' },
  };
  const c = config[type];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: '11px 14px',
      borderRadius: 'var(--radius)',
      background: c.bg,
      border: `1px solid ${c.border}`,
      fontSize: '13.5px',
      color: c.color,
      fontWeight: 500,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>
        {type === 'error' ? '✕' : type === 'success' ? '✓' : type === 'warning' ? '⚠' : 'ℹ'}
      </span>
      <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 400 }}>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1 }}>×</button>
      )}
    </div>
  );
}

/* ─── Modal ─── */
export function Modal({ isOpen, onClose, title, children, width = 520 }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26, 20, 10, 0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        padding: 24,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: width,
          boxShadow: 'var(--shadow-lg)',
          animation: 'fadeUp 0.2s ease',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-display" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1, padding: '0 2px', borderRadius: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Table ─── */
export function Table({ columns, data, loading, emptyState, rowKey = 'id' }) {
  if (loading) {
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
              {columns.map(col => (
                <th key={col.key} style={{ padding: '10px 16px', textAlign: col.align || 'left', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '13px 16px' }}>
                    <Skeleton height={12} width={col.skeletonWidth || '70%'} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface)' }}>
        {emptyState || <EmptyState title="No data yet" description="Nothing to show here." />}
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
              {columns.map(col => (
                <th key={col.key} style={{ padding: '10px 16px', textAlign: col.align || 'left', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row[rowKey] || i}
                style={{ borderBottom: i < data.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'var(--transition)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '12px 16px', textAlign: col.align || 'left', fontSize: '13.5px', color: 'var(--text-primary)', verticalAlign: 'middle' }}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── PageHeader ─── */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: subtitle ? 4 : 0 }}>
          {title}
        </h1>
        {subtitle && <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

/* ─── Tabs ─── */
export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '10px 16px',
              fontSize: '13.5px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'var(--transition)',
              marginBottom: '-1px',
              borderRadius: '0',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: isActive ? 'var(--accent-subtle)' : 'var(--surface-raised)', color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── FilterChips ─── */
export function FilterChips({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(opt => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)',
              border: isActive ? '1px solid var(--accent-border)' : '1px solid var(--border)',
              background: isActive ? 'var(--accent-subtle)' : 'var(--surface)',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            {opt.label}
            {opt.count !== undefined && <span style={{ marginLeft: 4, opacity: 0.65 }}>{opt.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ─── SearchInput ─── */
export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ position: 'absolute', left: 10, color: 'var(--text-muted)', flexShrink: 0, pointerEvents: 'none' }}>
        <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          paddingLeft: 32,
          paddingRight: 12,
          paddingTop: 8,
          paddingBottom: 8,
          fontSize: '13.5px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          outline: 'none',
          width: 240,
          transition: 'var(--transition)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  );
}

/* ─── MarginBar ─── */
export function MarginBar({ pct, width = 120 }) {
  const clamped = Math.max(0, Math.min(100, pct || 0));
  const color = marginColor(pct);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width, height: 5, borderRadius: 3, background: 'var(--surface-raised)', overflow: 'hidden' }}>
        <div style={{ width: `${clamped}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} />
      </div>
      <span className="mono" style={{ fontSize: '12px', color, fontWeight: 500, minWidth: 38 }}>
        {formatPercent(pct)}
      </span>
    </div>
  );
}

/* ─── PremiumGate ─── */
export function PremiumGate({ children, isPro, feature = 'This feature' }) {
  if (isPro) return children;
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.5 }}>
        {children}
      </div>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 10,
        background: 'rgba(243, 240, 232, 0.85)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <div style={{ fontSize: 24 }}>✦</div>
        <div className="font-display" style={{ fontWeight: 600, fontSize: '15px' }}>{feature} requires Pro</div>
        <Button size="sm" onClick={() => window.location.href = '/pricing'}>Upgrade to Pro</Button>
      </div>
    </div>
  );
}

/* ─── InlineEditCell ─── */
export function InlineEditCell({ value, onSave, format, placeholder = '—' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  const startEdit = () => {
    setDraft(value != null ? String(value) : '');
    setEditing(true);
  };

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const commit = () => {
    const num = parseFloat(draft);
    if (!isNaN(num) && num >= 0) onSave(num);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        style={{
          width: 90,
          padding: '4px 8px',
          border: '1px solid var(--accent)',
          borderRadius: 5,
          fontSize: '13px',
          fontFamily: "'JetBrains Mono', monospace",
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          outline: 'none',
          boxShadow: '0 0 0 3px var(--accent-subtle)',
        }}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      title="Click to edit"
      style={{
        cursor: 'text',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '13px',
        color: value != null ? 'var(--text-primary)' : 'var(--text-muted)',
        borderBottom: '1px dashed var(--border)',
        paddingBottom: 1,
      }}
    >
      {value != null ? (format ? format(value) : value) : placeholder}
    </span>
  );
}
