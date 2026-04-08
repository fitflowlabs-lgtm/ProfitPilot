import { useState, useEffect, useRef } from 'react';
import api from '../api.js';
import { useAuth } from '../App.jsx';
import { Button, Alert, Card, Skeleton, PageHeader } from '../components/UI.jsx';

function Typewriter({ text, speed = 12 }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;
    if (!text) return;
    const tick = () => {
      if (indexRef.current <= text.length) {
        setDisplayed(text.slice(0, indexRef.current));
        indexRef.current++;
        setTimeout(tick, speed);
      }
    };
    tick();
  }, [text, speed]);

  return (
    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
      {displayed}
      {displayed.length < text.length && (
        <span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--accent)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />
      )}
    </div>
  );
}

function ProBanner() {
  return (
    <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)', background: 'var(--yellow-bg)', border: '1px solid var(--yellow-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>Unlock AI Analysis</div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          AI-powered store summaries, per-product analysis, and inventory insights are available on Pro.
        </div>
      </div>
      <Button size="sm" onClick={() => window.location.href = '/pricing'} style={{ flexShrink: 0 }}>
        Upgrade to Pro
      </Button>
    </div>
  );
}

function StoreSummaryCard({ isPro }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const generate = async () => {
    if (!isPro) { window.location.href = '/pricing'; return; }
    setLoading(true);
    setError('');
    setText('');
    try {
      const data = await api.post('/api/ai/summary');
      setText(data.summary || data.text || '');
    } catch (err) {
      setError(err.message || 'Failed to generate. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5l1.2 2.4 2.8.4-2 2 .4 2.8L8 8l-2.4 1.1.4-2.8-2-2 2.8-.4L8 1.5z" stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M3 13l2-1M13 13l-2-1M8 12v2" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Store Executive Summary</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>GPT-powered analysis of your store health, risks, and opportunities</div>
          </div>
        </div>
        <Button loading={loading} onClick={generate} variant={text ? 'secondary' : 'primary'} size="sm">
          {text ? 'Refresh' : 'Generate'}
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      {loading && !text && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[1, 0.85, 0.7, 1, 0.9, 0.6].map((w, i) => (
            <Skeleton key={i} height={12} width={`${w * 100}%`} />
          ))}
        </div>
      )}

      {!loading && !text && !error && (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ opacity: 0.25, fontSize: 32, marginBottom: 10 }}>✦</div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            {isPro ? 'Click Generate to create an AI-powered executive summary of your store.' : 'Upgrade to Pro to unlock AI analysis.'}
          </p>
        </div>
      )}

      {text && <Typewriter text={text} />}
    </Card>
  );
}

function ProductAIAccordion({ isPro }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const [analyses, setAnalyses] = useState({});
  const [analysisLoading, setAnalysisLoading] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/api/products');
        setProducts((data.variants || data.products || data || []).slice(0, 20));
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const analyze = async (id) => {
    if (!isPro) { window.location.href = '/pricing'; return; }
    if (analyses[id]) return;
    setAnalysisLoading(s => ({ ...s, [id]: true }));
    try {
      const data = await api.post(`/api/ai/product/${id}`);
      setAnalyses(prev => ({ ...prev, [id]: data.analysis || data.text || '' }));
    } catch (err) {
      setAnalyses(prev => ({ ...prev, [id]: 'Analysis failed. Please try again.' }));
    } finally {
      setAnalysisLoading(s => ({ ...s, [id]: false }));
    }
  };

  const toggleOpen = (id) => {
    const next = open === id ? null : id;
    setOpen(next);
    if (next && !analyses[next]) analyze(next);
  };

  return (
    <div>
      <div className="font-display" style={{ fontSize: '16px', fontWeight: 700, marginBottom: 14, color: 'var(--text-primary)' }}>
        Per-product analysis
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} height={52} style={{ borderRadius: 8 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {products.map(p => {
            const isOpen = open === p.id;
            const analysis = analyses[p.id];
            const isLoading = analysisLoading[p.id];

            return (
              <div key={p.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface)' }}>
                <button
                  onClick={() => toggleOpen(p.id)}
                  style={{
                    width: '100%', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: isOpen ? 'var(--surface-raised)' : 'var(--surface)',
                    border: 'none', cursor: 'pointer', transition: 'var(--transition)', gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: analysis ? 'var(--green)' : 'var(--border)', flexShrink: 0 }} />
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.productTitle || p.title}
                    </span>
                    {p.variantTitle && p.variantTitle !== 'Default Title' && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>{p.variantTitle}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {!analysis && !isLoading && (
                      <span style={{ fontSize: '11.5px', color: 'var(--accent)', fontWeight: 600 }}>Analyze</span>
                    )}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', color: 'var(--text-muted)' }}>
                      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                    {isLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Skeleton height={11} /><Skeleton height={11} width="85%" /><Skeleton height={11} width="70%" />
                      </div>
                    ) : analysis ? (
                      <Typewriter text={analysis} />
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AIPage() {
  const { user } = useAuth();
  const isPro = user?.plan === 'pro';

  return (
    <div className="page-content">
      <PageHeader
        title="AI Analysis"
        subtitle="GPT-powered insights about your store, pricing, and inventory"
      />

      {!isPro && <ProBanner />}

      <StoreSummaryCard isPro={isPro} />
      <ProductAIAccordion isPro={isPro} />
    </div>
  );
}
