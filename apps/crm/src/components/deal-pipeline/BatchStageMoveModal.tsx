import { useState } from 'react';
import { Modal } from '../Modal';
import { ArrowRight, CheckCircle2, Loader2, AlertCircle, DollarSign } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface BatchStageMoveModalProps { open: boolean; onClose: () => void; stageNames: string[]; onBatchMove?: (fromStage: string, toStage: string) => Promise<void>; }

export function BatchStageMoveModal({ open, onClose, stageNames, onBatchMove }: BatchStageMoveModalProps) {
  const [fromStage, setFromStage] = useState('');
  const [toStage, setToStage] = useState('');
  const [moving, setMoving] = useState(false);
  const [done, setDone] = useState(false);

  const handleMove = async () => {
    if (!fromStage || !toStage) return;
    setMoving(true);
    if (onBatchMove) await onBatchMove(fromStage, toStage);
    else await new Promise((r) => setTimeout(r, 1000));
    setMoving(false);
    setDone(true);
  };

  const handleClose = () => { setDone(false); setFromStage(''); setToStage(''); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Batch Stage Move" size="md">
      <div className="space-y-4">
        {done ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-lg font-bold text-th-text-primary">Deals Moved</p>
            <p className="text-sm text-th-text-secondary">All deals from <strong>{fromStage}</strong> moved to <strong>{toStage}</strong></p>
            <button onClick={handleClose} className="px-6 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600">Done</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-th-text-secondary block mb-1.5">From Stage</label>
                <div className="space-y-1">
                  {stageNames.map((s) => (
                    <button key={s} onClick={() => setFromStage(s)} className={cn(
                      'w-full text-left px-3 py-2 rounded-xl text-sm border transition-all',
                      fromStage === s ? 'border-red-500/50 bg-red-500/10 text-red-500 font-medium' : 'border-th-border/30 text-th-text-secondary hover:bg-surface-secondary'
                    )}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-th-text-secondary block mb-1.5">To Stage</label>
                <div className="space-y-1">
                  {stageNames.filter((s) => s !== fromStage).map((s) => (
                    <button key={s} onClick={() => setToStage(s)} className={cn(
                      'w-full text-left px-3 py-2 rounded-xl text-sm border transition-all',
                      toStage === s ? 'border-green-500/50 bg-green-500/10 text-green-500 font-medium' : 'border-th-border/30 text-th-text-secondary hover:bg-surface-secondary'
                    )}>{s}</button>
                  ))}
                </div>
              </div>
            </div>

            {fromStage && toStage && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs text-amber-700 dark:text-amber-300">
                  All deals in <strong>{fromStage}</strong> will be moved to <strong>{toStage}</strong>
                </span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
              <button onClick={handleMove} disabled={!fromStage || !toStage || moving}
                className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {moving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Move All
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
