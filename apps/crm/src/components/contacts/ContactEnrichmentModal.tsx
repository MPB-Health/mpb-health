import { useState } from 'react';
import { Modal } from '../Modal';
import { Sparkles, CheckCircle2, AlertCircle, Loader2, Users, Mail, Phone, MapPin, Building2, Globe } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface EnrichResult { field: string; icon: typeof Mail; current: string; enriched: string; confidence: number; selected: boolean; }
interface ContactEnrichmentModalProps { open: boolean; onClose: () => void; totalContacts: number; }

const MOCK_ENRICHABLE = [
  { id: '1', name: 'Brett Baker', email: 'brettbaker7@me.com', missingFields: ['phone', 'title', 'company'] },
  { id: '2', name: 'Patricia Moore', email: 'patricia@example.com', missingFields: ['phone', 'address', 'linkedin'] },
  { id: '3', name: 'David Brown', email: 'dbrown@example.com', missingFields: ['title', 'company'] },
  { id: '4', name: 'Jennifer White', email: 'jwhite@example.com', missingFields: ['phone', 'address'] },
  { id: '5', name: 'Robert Chen', email: 'rchen@example.com', missingFields: ['title', 'linkedin', 'address'] },
];

const MOCK_RESULTS: EnrichResult[] = [
  { field: 'Phone', icon: Phone, current: '—', enriched: '(555) 234-5678', confidence: 92, selected: true },
  { field: 'Title', icon: Building2, current: '—', enriched: 'Benefits Manager', confidence: 85, selected: true },
  { field: 'Company', icon: Building2, current: '—', enriched: 'Baker & Associates', confidence: 78, selected: true },
  { field: 'City', icon: MapPin, current: '—', enriched: 'Tampa, FL', confidence: 88, selected: true },
  { field: 'LinkedIn', icon: Globe, current: '—', enriched: 'linkedin.com/in/brettbaker', confidence: 71, selected: false },
];

export function ContactEnrichmentModal({ open, onClose, totalContacts }: ContactEnrichmentModalProps) {
  const [step, setStep] = useState<'scan' | 'scanning' | 'results' | 'enriching' | 'done'>('scan');
  const [results, setResults] = useState(MOCK_RESULTS);

  const missingTotal = MOCK_ENRICHABLE.reduce((s, c) => s + c.missingFields.length, 0);
  const selectedCount = results.filter((r) => r.selected).length;

  const toggleResult = (idx: number) => {
    setResults((prev) => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r));
  };

  const handleScan = async () => {
    setStep('scanning');
    await new Promise((r) => setTimeout(r, 1200));
    setStep('results');
  };

  const handleEnrich = async () => {
    setStep('enriching');
    await new Promise((r) => setTimeout(r, 1000));
    setStep('done');
  };

  const handleClose = () => { setStep('scan'); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Contact Enrichment" size="xl">
      <div className="space-y-4">
        {step === 'scan' && (
          <>
            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 text-center">
              <Sparkles className="w-8 h-8 text-violet-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-th-text-primary">AI-Powered Data Enrichment</p>
              <p className="text-xs text-th-text-secondary mt-1">Scan your contacts to find and fill missing data from external sources</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30 text-center">
                <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-th-text-primary">{MOCK_ENRICHABLE.length}</p>
                <p className="text-[10px] text-th-text-tertiary">Contacts to Enrich</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30 text-center">
                <AlertCircle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-th-text-primary">{missingTotal}</p>
                <p className="text-[10px] text-th-text-tertiary">Missing Fields</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30 text-center">
                <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-th-text-primary">{((1 - MOCK_ENRICHABLE.length / totalContacts) * 100).toFixed(0)}%</p>
                <p className="text-[10px] text-th-text-tertiary">Data Completeness</p>
              </div>
            </div>

            <div className="max-h-[180px] overflow-y-auto space-y-1.5">
              {MOCK_ENRICHABLE.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-th-border/30">
                  <div className="w-7 h-7 rounded-full bg-th-accent-100 flex items-center justify-center text-[10px] font-bold text-th-accent-700 shrink-0">
                    {c.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-th-text-primary">{c.name}</span>
                    <span className="text-[10px] text-th-text-tertiary ml-2">{c.email}</span>
                  </div>
                  <div className="flex gap-1">
                    {c.missingFields.map((f) => (
                      <span key={f} className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500">{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleScan} className="w-full py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> Scan & Enrich Contacts
            </button>
          </>
        )}

        {step === 'scanning' && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-violet-500 mx-auto animate-spin" />
            <p className="text-sm font-medium text-th-text-primary">Scanning external sources...</p>
            <p className="text-xs text-th-text-tertiary">Checking public records, social profiles, and business directories</p>
          </div>
        )}

        {step === 'results' && (
          <>
            <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <span className="text-xs text-green-700 dark:text-green-300 font-medium">Found {results.length} data points to enrich</span>
            </div>

            <div className="space-y-1.5">
              {results.map((r, idx) => {
                const RIcon = r.icon;
                return (
                  <label key={r.field} className="flex items-center gap-3 p-2.5 rounded-xl border border-th-border/30 hover:bg-surface-secondary/30 cursor-pointer">
                    <input type="checkbox" checked={r.selected} onChange={() => toggleResult(idx)} className="rounded" />
                    <RIcon className="w-4 h-4 text-th-text-tertiary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-th-text-primary">{r.field}</span>
                        <span className="text-[10px] text-th-text-tertiary line-through">{r.current}</span>
                        <span className="text-[10px] text-green-500 font-medium">→ {r.enriched}</span>
                      </div>
                    </div>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums',
                      r.confidence >= 80 ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                    )}>{r.confidence}%</span>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary">Cancel</button>
              <button onClick={handleEnrich} disabled={selectedCount === 0}
                className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600 disabled:opacity-50">
                Apply {selectedCount} Enrichments
              </button>
            </div>
          </>
        )}

        {step === 'enriching' && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-th-accent-500 mx-auto animate-spin" />
            <p className="text-sm font-medium text-th-text-primary">Applying enrichments...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-lg font-bold text-th-text-primary">Enrichment Complete</p>
            <p className="text-sm text-th-text-secondary">{selectedCount} fields updated across your contacts</p>
            <button onClick={handleClose} className="px-6 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600">Done</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
