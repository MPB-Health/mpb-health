import { useState } from 'react';
import { Modal } from '../Modal';
import { Merge, CheckCircle2, ArrowRight, Building2, AlertCircle, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DuplicateGroup { primary: DupeAccount; duplicates: DupeAccount[]; matchScore: number; matchReason: string; }
interface DupeAccount { id: string; name: string; type: string; industry: string; phone: string; contacts: number; deals: number; }
interface AccountMergeModalProps { open: boolean; onClose: () => void; }

const MOCK_DUPLICATES: DuplicateGroup[] = [
  { matchScore: 92, matchReason: 'Similar name + same phone', primary: { id: '1', name: 'Acme Health Group', type: 'customer', industry: 'Healthcare', phone: '555-0100', contacts: 8, deals: 12 },
    duplicates: [{ id: '2', name: 'Acme Health Grp.', type: 'prospect', industry: 'Healthcare', phone: '555-0100', contacts: 2, deals: 1 }] },
  { matchScore: 85, matchReason: 'Same website domain', primary: { id: '3', name: 'BlueCross Partners Corp', type: 'customer', industry: 'Insurance', phone: '555-0200', contacts: 5, deals: 8 },
    duplicates: [{ id: '4', name: 'Blue Cross Partners', type: 'customer', industry: 'Insurance', phone: '555-0201', contacts: 3, deals: 4 }] },
  { matchScore: 78, matchReason: 'Similar name + same industry', primary: { id: '5', name: 'Medicare Solutions Inc', type: 'customer', industry: 'Insurance', phone: '555-0300', contacts: 4, deals: 6 },
    duplicates: [{ id: '6', name: 'Medicare Solutions', type: 'prospect', industry: 'Insurance', phone: '', contacts: 1, deals: 0 }] },
];

export function AccountMergeModal({ open, onClose }: AccountMergeModalProps) {
  const [merged, setMerged] = useState<Set<string>>(new Set());
  const [merging, setMerging] = useState<string | null>(null);

  const handleMerge = async (groupIdx: number) => {
    setMerging(String(groupIdx));
    await new Promise((r) => setTimeout(r, 800));
    setMerged((prev) => new Set([...prev, String(groupIdx)]));
    setMerging(null);
  };

  const remaining = MOCK_DUPLICATES.filter((_, i) => !merged.has(String(i)));

  return (
    <Modal open={open} onClose={onClose} title="Merge Duplicate Accounts" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <Merge className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_DUPLICATES.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Duplicate Groups</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{merged.size}</p>
            <p className="text-[10px] text-th-text-tertiary">Merged</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Building2 className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{remaining.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Remaining</p>
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto space-y-3">
          {MOCK_DUPLICATES.map((group, idx) => {
            const isMerged = merged.has(String(idx));
            return (
              <div key={idx} className={cn('p-3 rounded-xl border transition-all', isMerged ? 'border-green-500/30 bg-green-500/5 opacity-60' : 'border-th-border/50')}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold tabular-nums">{group.matchScore}% match</span>
                  <span className="text-[10px] text-th-text-tertiary">{group.matchReason}</span>
                  {isMerged && <span className="text-[10px] text-green-500 font-medium ml-auto flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Merged</span>}
                </div>

                <div className="flex items-center gap-2">
                  {/* Primary */}
                  <div className="flex-1 p-2 rounded-lg bg-surface-secondary/50 border border-th-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-th-accent-500" />
                      <span className="text-xs font-semibold text-th-text-primary">{group.primary.name}</span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/10 text-green-600 font-medium">Primary</span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-th-text-tertiary">
                      <span>{group.primary.type}</span>
                      <span>{group.primary.contacts} contacts</span>
                      <span>{group.primary.deals} deals</span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-th-text-tertiary shrink-0" />

                  {/* Duplicate */}
                  {group.duplicates.map((dupe) => (
                    <div key={dupe.id} className="flex-1 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-xs font-medium text-th-text-primary">{dupe.name}</span>
                        <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/10 text-red-600 font-medium">Duplicate</span>
                      </div>
                      <div className="flex gap-3 text-[10px] text-th-text-tertiary">
                        <span>{dupe.type}</span>
                        <span>{dupe.contacts} contacts</span>
                        <span>{dupe.deals} deals</span>
                      </div>
                    </div>
                  ))}
                </div>

                {!isMerged && (
                  <div className="flex gap-2 mt-2">
                    <button className="text-[10px] text-th-text-tertiary hover:text-th-text-secondary">Dismiss</button>
                    <div className="flex-1" />
                    <button onClick={() => handleMerge(idx)} disabled={merging === String(idx)}
                      className="px-3 py-1 rounded-lg bg-th-accent-500 text-white text-[10px] font-medium hover:bg-th-accent-600 disabled:opacity-50">
                      {merging === String(idx) ? 'Merging...' : 'Merge into Primary'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
