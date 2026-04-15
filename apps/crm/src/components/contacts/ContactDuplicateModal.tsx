import { useState } from 'react';
import { Modal } from '../Modal';
import { Copy, CheckCircle2, ArrowRight, Users, AlertCircle, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DupeGroup { score: number; reason: string; primary: { id: string; name: string; email: string; phone: string; account: string }; duplicate: { id: string; name: string; email: string; phone: string; account: string }; }
interface ContactDuplicateModalProps { open: boolean; onClose: () => void; }

const MOCK_DUPES: DupeGroup[] = [
  { score: 95, reason: 'Same email address', primary: { id: '1', name: 'Brett Baker', email: 'brettbaker7@me.com', phone: '555-0101', account: 'Acme Health' }, duplicate: { id: '2', name: 'Brett E. Baker', email: 'brettbaker7@me.com', phone: '', account: '' }},
  { score: 88, reason: 'Same phone + similar name', primary: { id: '3', name: 'Patricia Moore', email: 'patricia@example.com', phone: '555-0202', account: 'BlueCross' }, duplicate: { id: '4', name: 'Pat Moore', email: 'pat.moore@gmail.com', phone: '555-0202', account: '' }},
  { score: 82, reason: 'Similar name + same account', primary: { id: '5', name: 'David Brown', email: 'dbrown@example.com', phone: '555-0303', account: 'Medicare Solutions' }, duplicate: { id: '6', name: 'Dave Brown', email: 'dave.b@example.com', phone: '', account: 'Medicare Solutions' }},
  { score: 76, reason: 'Similar email pattern', primary: { id: '7', name: 'Jennifer White', email: 'jwhite@example.com', phone: '555-0404', account: 'Senior Care' }, duplicate: { id: '8', name: 'Jennifer W.', email: 'j.white@example.com', phone: '', account: '' }},
];

export function ContactDuplicateModal({ open, onClose }: ContactDuplicateModalProps) {
  const [merged, setMerged] = useState<Set<number>>(new Set());
  const [merging, setMerging] = useState<number | null>(null);

  const handleMerge = async (idx: number) => {
    setMerging(idx);
    await new Promise((r) => setTimeout(r, 700));
    setMerged((prev) => new Set([...prev, idx]));
    setMerging(null);
  };

  return (
    <Modal open={open} onClose={onClose} title="Duplicate Contacts" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <Copy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_DUPES.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Duplicate Groups</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{merged.size}</p>
            <p className="text-[10px] text-th-text-tertiary">Merged</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_DUPES.length - merged.size}</p>
            <p className="text-[10px] text-th-text-tertiary">Remaining</p>
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto space-y-2">
          {MOCK_DUPES.map((group, idx) => {
            const isMerged = merged.has(idx);
            return (
              <div key={idx} className={cn('p-3 rounded-xl border transition-all', isMerged ? 'border-green-500/30 bg-green-500/5 opacity-60' : 'border-th-border/50')}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold tabular-nums">{group.score}%</span>
                  <span className="text-[10px] text-th-text-tertiary">{group.reason}</span>
                  {isMerged && <span className="text-[10px] text-green-500 font-medium ml-auto flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Merged</span>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 rounded-lg bg-surface-secondary/50 border border-th-border/30">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-xs font-semibold text-th-text-primary">{group.primary.name}</span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/10 text-green-600 font-medium">Keep</span>
                    </div>
                    <div className="text-[10px] text-th-text-tertiary space-y-0.5">
                      <p>{group.primary.email}</p>
                      {group.primary.phone && <p>{group.primary.phone}</p>}
                      {group.primary.account && <p>{group.primary.account}</p>}
                    </div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-th-text-tertiary shrink-0" />
                  <div className="flex-1 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-xs font-medium text-th-text-primary">{group.duplicate.name}</span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/10 text-red-600 font-medium">Merge</span>
                    </div>
                    <div className="text-[10px] text-th-text-tertiary space-y-0.5">
                      <p>{group.duplicate.email}</p>
                      {group.duplicate.phone && <p>{group.duplicate.phone}</p>}
                      {group.duplicate.account && <p>{group.duplicate.account}</p>}
                    </div>
                  </div>
                </div>
                {!isMerged && (
                  <div className="flex gap-2 mt-2">
                    <button className="text-[10px] text-th-text-tertiary hover:text-th-text-secondary">Dismiss</button>
                    <div className="flex-1" />
                    <button onClick={() => handleMerge(idx)} disabled={merging === idx}
                      className="px-3 py-1 rounded-lg bg-th-accent-500 text-white text-[10px] font-medium hover:bg-th-accent-600 disabled:opacity-50">
                      {merging === idx ? 'Merging...' : 'Merge'}
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
