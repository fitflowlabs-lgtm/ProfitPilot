import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import api from '../api.js';
import { Button, Alert, Modal } from './UI.jsx';

const ACCEPTED = '.csv,.xlsx,.xls,.ods,.tsv';

function parseCSVText(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { error: 'File must have a header row and at least one data row.' };
  const sep = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(l => l.split(sep).map(c => c.trim().replace(/^"|"$/g, '')));
  return { headers, rows };
}

function readFileAsWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (data.length < 2) { reject(new Error('Sheet has no data rows.')); return; }
        const headers = data[0].map(h => String(h).trim());
        const rows = data.slice(1).map(r => r.map(c => String(c).trim()));
        resolve({ headers, rows });
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsBinaryString(file);
  });
}

function tryStandardParse(headers, rows) {
  const skuIdx = headers.findIndex(h => /^sku$/i.test(h));
  const costIdx = headers.findIndex(h => /^(cost|cogs|unit.?cost|wholesale|supplier.?price)$/i.test(h));
  if (skuIdx === -1 || costIdx === -1) return null;
  const parsed = [];
  const rowErrors = [];
  for (let i = 0; i < rows.length; i++) {
    const sku = rows[i][skuIdx];
    const cost = parseFloat(String(rows[i][costIdx]).replace(/[$,]/g, ''));
    if (!sku) continue;
    if (isNaN(cost)) { rowErrors.push(`Row ${i + 2}: SKU "${sku}" — invalid cost "${rows[i][costIdx] || '(empty)'}"`); continue; }
    parsed.push({ sku, cost });
  }
  return { parsed, rowErrors };
}

export default function COGSImportModal({ isOpen, onClose, onImported }) {
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [aiParsing, setAiParsing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;
    setParseError('');
    setResult(null);
    setRows([]);
    setFileName(file.name);

    try {
      let headers, rawRows;

      if (file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
        const text = await file.text();
        const parsed = parseCSVText(text);
        if (parsed.error) { setParseError(parsed.error); return; }
        headers = parsed.headers;
        rawRows = parsed.rows;
      } else {
        const parsed = await readFileAsWorkbook(file);
        headers = parsed.headers;
        rawRows = parsed.rows;
      }

      // Try standard column name matching first
      const standard = tryStandardParse(headers, rawRows);
      if (standard && standard.parsed.length > 0) {
        if (standard.rowErrors.length > 0) {
          setParseError(`${standard.rowErrors.length} row${standard.rowErrors.length !== 1 ? 's' : ''} skipped: ${standard.rowErrors.slice(0, 2).join(' · ')}${standard.rowErrors.length > 2 ? ` (+${standard.rowErrors.length - 2} more)` : ''}`);
        }
        setRows(standard.parsed);
        return;
      }

      // Fall back to AI column identification
      setAiParsing(true);
      try {
        const data = await api.post('/api/variants/parse-cogs-ai', {
          headers,
          rows: rawRows.slice(0, 15),
          totalRows: rawRows.length,
        });

        if (data.error) { setParseError(data.error); return; }

        const skuIdx = data.skuCol;
        const costIdx = data.costCol;

        if (skuIdx == null || costIdx == null || skuIdx === -1 || costIdx === -1) {
          setParseError(`AI couldn't identify SKU and cost columns. Columns: ${headers.join(', ')}. Try renaming them to "sku" and "cost".`);
          return;
        }

        const parsed = [];
        const rowErrors = [];
        for (let i = 0; i < rawRows.length; i++) {
          const sku = rawRows[i][skuIdx];
          const cost = parseFloat(String(rawRows[i][costIdx]).replace(/[$,]/g, ''));
          if (!sku) continue;
          if (isNaN(cost)) { rowErrors.push(`Row ${i + 2}: SKU "${sku}" — invalid cost "${rawRows[i][costIdx]}"`); continue; }
          parsed.push({ sku, cost });
        }

        if (parsed.length === 0) {
          setParseError(rowErrors.length > 0 ? `All rows had errors: ${rowErrors.slice(0, 3).join(' · ')}` : 'No valid rows after AI parsing.');
          return;
        }

        setParseError(`AI identified "${data.skuHeader}" → SKU, "${data.costHeader}" → Cost${rowErrors.length > 0 ? `. ${rowErrors.length} rows skipped.` : '.'}`);
        setRows(parsed);
      } finally {
        setAiParsing(false);
      }
    } catch (e) {
      setParseError(e.message || 'Could not read file.');
      setAiParsing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
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
      setResult({ message: `Updated ${data.updated ?? 0} products. Not found: ${data.notFound ?? 0}. Errors: ${data.errors ?? 0}.` });
      if (onImported) onImported();
    } catch (e) {
      setError(e.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'sku,cost\nEXAMPLE-SKU-001,9.99\nEXAMPLE-SKU-002,14.50\n';
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
    setFileName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import COGS" width={600}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Explainer */}
        <div style={{ padding: '12px 14px', borderRadius: 'var(--radius)', background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>COGS</strong> (Cost of Goods Sold) is what you pay your supplier per unit. Setting accurate costs lets Margin Pilot calculate your real profit margins.
          <div style={{ marginTop: 6, fontSize: '12px', color: 'var(--text-muted)' }}>
            Upload any spreadsheet — CSV, Excel (.xlsx), or ODS. If your columns aren't named "sku" and "cost", AI will identify them automatically.
          </div>
        </div>

        {/* Template download */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={downloadTemplate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface-raised)', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'var(--transition)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-raised)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1.5v7M3.5 5.5l3 3 3-3M1.5 10.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download template
          </button>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or upload your own spreadsheet — AI will figure it out</span>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !aiParsing && fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent)' : rows.length > 0 ? 'var(--accent-border)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '28px 16px',
            textAlign: 'center',
            cursor: aiParsing ? 'default' : 'pointer',
            background: dragging ? 'var(--accent-subtle)' : rows.length > 0 ? 'rgba(26,92,56,0.04)' : 'var(--surface-raised)',
            transition: 'var(--transition)',
          }}
        >
          {aiParsing ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite', opacity: 0.6 }}>
                <circle cx="12" cy="12" r="9" stroke="var(--accent)" strokeWidth="2" strokeDasharray="56" strokeDashoffset="14" strokeLinecap="round" />
              </svg>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>AI is reading your spreadsheet…</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Identifying SKU and cost columns</div>
            </div>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 8px', display: 'block', opacity: rows.length > 0 ? 0.7 : 0.4, color: rows.length > 0 ? 'var(--accent)' : 'currentColor' }}>
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 4v12M8 8l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: rows.length > 0 ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 4 }}>
                {rows.length > 0 ? `✓ ${rows.length} rows loaded${fileName ? ` from ${fileName}` : ''}` : 'Drop spreadsheet here or click to browse'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {rows.length > 0 ? 'Click to upload a different file' : 'CSV · Excel (.xlsx / .xls) · ODS · TSV'}
              </div>
            </>
          )}
          <input ref={fileRef} type="file" accept={ACCEPTED} style={{ display: 'none' }} onChange={e => { processFile(e.target.files[0]); e.target.value = ''; }} />
        </div>

        {parseError && <Alert type={rows.length > 0 ? 'warning' : 'error'} message={parseError} />}
        {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
        {result && <Alert type="success" message={result.message} />}

        {/* Preview */}
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
            {rows.length > 50 && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>Showing first 50 of {rows.length} rows</div>}
          </div>
        )}

        {/* Footer actions */}
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
