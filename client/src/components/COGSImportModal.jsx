import { useState, useRef } from 'react';
import api from '../api.js';
import { Button, Alert, Modal } from './UI.jsx';

export default function COGSImportModal({ isOpen, onClose, onImported }) {
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const parseCSV = (text) => {
    setParseError('');
    setResult(null);
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) { setParseError('CSV must have a header row and at least one data row.'); return; }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const skuIdx = headers.indexOf('sku');
    const costIdx = headers.indexOf('cost');
    if (skuIdx === -1 || costIdx === -1) {
      setParseError('CSV must have "sku" and "cost" columns.');
      return;
    }
    const parsed = [];
    const rowErrors = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const sku = cols[skuIdx];
      const costRaw = cols[costIdx];
      const cost = parseFloat(costRaw);
      if (!sku) { rowErrors.push(`Row ${i + 1}: missing SKU`); continue; }
      if (isNaN(cost)) { rowErrors.push(`Row ${i + 1}: SKU "${sku}" has invalid cost "${costRaw || '(empty)'}"`); continue; }
      parsed.push({ sku, cost });
    }
    if (parsed.length === 0) {
      setParseError(rowErrors.length > 0 ? rowErrors.slice(0, 3).join(' · ') + (rowErrors.length > 3 ? ` (+${rowErrors.length - 3} more)` : '') : 'No valid rows found in CSV.');
      return;
    }
    if (rowErrors.length > 0) setParseError(`${rowErrors.length} row${rowErrors.length !== 1 ? 's' : ''} skipped: ${rowErrors.slice(0, 2).join(' · ')}${rowErrors.length > 2 ? ` (+${rowErrors.length - 2} more)` : ''}`);
    setRows(parsed);
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setParseError('Please upload a .csv file.'); return; }
    const reader = new FileReader();
    reader.onload = e => parseCSV(e.target.result);
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleSyncMetafields = async () => {
    setSyncing(true);
    setError('');
    setResult(null);
    try {
      const data = await api.post('/api/sync/metafields-cogs');
      setResult({ message: `Synced from metafields: updated ${data.updated ?? 0} products.` });
      if (onImported) onImported();
    } catch (e) {
      setError(e.message || 'Metafields sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    setError('');
    setResult(null);
    try {
      const data = await api.post('/api/variants/import-cogs', { rows: rows.map(r => ({ sku: r.sku, cogs: r.cost })) });
      setResult({
        message: `Updated ${data.updated ?? 0} products. Not found: ${data.notFound ?? 0}. Errors: ${data.errors ?? 0}.`,
      });
      if (onImported) onImported();
    } catch (e) {
      setError(e.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'sku,cost\nEXAMPLE-SKU,9.99\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cogs-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setRows([]);
    setParseError('');
    setResult(null);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import COGS" width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Instructions */}
        <div style={{ padding: '12px 14px', borderRadius: 'var(--radius)', background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>COGS</strong> (Cost of Goods Sold) is the price you pay to source each product — what you paid your supplier, not what you charge customers. Setting accurate costs lets Margin Pilot calculate your real profit margins and flag products where you might be losing money.
          <div style={{ marginTop: 8, fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Upload a CSV with two columns: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>sku</span> and <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>cost</span>. You can also sync costs directly from Shopify product metafields.
          </div>
        </div>

        {/* Download template */}
        <button
          onClick={downloadTemplate}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface-raised)', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', alignSelf: 'flex-start', transition: 'var(--transition)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-raised)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1.5v7M3.5 5.5l3 3 3-3M1.5 10.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Download template
        </button>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '28px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'var(--accent-subtle)' : 'var(--surface-raised)',
            transition: 'var(--transition)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }}>
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 4v12M8 8l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            {rows.length > 0 ? `${rows.length} rows loaded` : 'Drop CSV here or click to browse'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>.csv files only</div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>

        {parseError && <Alert type="error" message={parseError} />}
        {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
        {result && <Alert type="success" message={result.message} />}

        {/* Preview table */}
        {rows.length > 0 && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              Preview · {rows.length} rows
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SKU</th>
                    <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i} style={{ borderBottom: i < Math.min(rows.length, 50) - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td style={{ padding: '7px 12px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{r.sku}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-primary)' }}>${r.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 50 && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>Showing first 50 of {rows.length} rows</div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" loading={syncing} onClick={handleSyncMetafields}>
            Sync from Shopify metafields
          </Button>
          {rows.length > 0 && (
            <Button size="sm" loading={importing} onClick={handleImport}>
              Import {rows.length} rows
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleClose} style={{ marginLeft: 'auto' }}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
