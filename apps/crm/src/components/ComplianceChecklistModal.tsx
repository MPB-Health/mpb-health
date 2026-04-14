import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import {
  ShieldCheck, Check, AlertTriangle, Clock, FileText, Upload,
  Download, CheckCircle2, XCircle, ChevronDown, ChevronRight,
  User, Calendar, Lock, Eye,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

type ComplianceStatus = 'complete' | 'pending' | 'overdue' | 'not_required';

interface ComplianceItem {
  id: string;
  category: string;
  name: string;
  description: string;
  status: ComplianceStatus;
  completedAt?: string;
  completedBy?: string;
  dueDate?: string;
  documentUrl?: string;
  required: boolean;
}

interface ComplianceChecklistModalProps {
  open: boolean;
  onClose: () => void;
  leadName: string;
  leadId: string;
  items: ComplianceItem[];
  onMarkComplete: (itemId: string) => Promise<void>;
  onUploadDocument: (itemId: string, file: File) => Promise<void>;
  onExportAudit?: () => void;
}

const STATUS_CONFIG: Record<ComplianceStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  complete: { label: 'Complete', icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  overdue: { label: 'Overdue', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  not_required: { label: 'N/A', icon: XCircle, color: 'text-th-text-tertiary', bg: 'bg-surface-tertiary' },
};

const DEFAULT_ITEMS: ComplianceItem[] = [
  { id: 'soa', category: 'Pre-Enrollment', name: 'Scope of Appointment (SOA)', description: 'Document signed at least 48 hours before appointment', status: 'pending', required: true, dueDate: new Date(Date.now() + 2 * 86400000).toISOString() },
  { id: 'ptc', category: 'Pre-Enrollment', name: 'Permission to Contact', description: 'Written or recorded consent to contact the beneficiary', status: 'pending', required: true },
  { id: 'needs-assess', category: 'Pre-Enrollment', name: 'Needs Assessment', description: 'Documented client needs analysis and health priorities', status: 'pending', required: true },
  { id: 'plan-compare', category: 'Enrollment', name: 'Plan Comparison Provided', description: 'Client received side-by-side plan comparison document', status: 'pending', required: true },
  { id: 'disclosure', category: 'Enrollment', name: 'Agent Disclosure', description: 'Agent compensation and relationship disclosure signed', status: 'pending', required: true },
  { id: 'enrollment-form', category: 'Enrollment', name: 'Enrollment Application', description: 'Completed and signed enrollment application', status: 'pending', required: true },
  { id: 'hipaa', category: 'Enrollment', name: 'HIPAA Authorization', description: 'Health information privacy authorization on file', status: 'pending', required: true },
  { id: 'confirmation', category: 'Post-Enrollment', name: 'Enrollment Confirmation', description: 'Client received enrollment confirmation letter/email', status: 'pending', required: true },
  { id: 'welcome-call', category: 'Post-Enrollment', name: 'Welcome Call Completed', description: 'Post-enrollment welcome call logged', status: 'pending', required: false },
  { id: 'id-card', category: 'Post-Enrollment', name: 'ID Card Received', description: 'Client confirmed receipt of insurance ID card', status: 'pending', required: false },
  { id: 'eo-notes', category: 'E&O Protection', name: 'E&O Documentation', description: 'Errors & omissions notes documenting suitability of recommendation', status: 'pending', required: true },
  { id: 'call-recording', category: 'E&O Protection', name: 'Call Recording Consent', description: 'Consent for call recording obtained and documented', status: 'pending', required: false },
];

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ComplianceChecklistModal({
  open, onClose, leadName, leadId, items: propItems, onMarkComplete, onUploadDocument, onExportAudit,
}: ComplianceChecklistModalProps) {
  const items = propItems.length > 0 ? propItems : DEFAULT_ITEMS;
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(
    Array.from(new Set(items.map((i) => i.category)))
  ));
  const [marking, setMarking] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ComplianceStatus>>({});

  const effectiveItems = useMemo(() =>
    items.map((item) => ({ ...item, status: statusOverrides[item.id] || item.status })),
    [items, statusOverrides]
  );

  const categories = useMemo(() => {
    const map = new Map<string, typeof effectiveItems>();
    effectiveItems.forEach((item) => {
      const arr = map.get(item.category) || [];
      arr.push(item);
      map.set(item.category, arr);
    });
    return Array.from(map.entries());
  }, [effectiveItems]);

  const stats = useMemo(() => {
    const required = effectiveItems.filter((i) => i.required);
    const complete = required.filter((i) => i.status === 'complete').length;
    const overdue = required.filter((i) => i.status === 'overdue').length;
    return { total: required.length, complete, overdue, pct: required.length ? Math.round((complete / required.length) * 100) : 0 };
  }, [effectiveItems]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleMark = async (itemId: string) => {
    setMarking(itemId);
    try {
      await onMarkComplete(itemId);
      setStatusOverrides((prev) => ({ ...prev, [itemId]: 'complete' }));
    } catch { /* parent handles */ }
    finally { setMarking(null); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Compliance Checklist — ${leadName}`} size="xl">
      <div className="space-y-4">
        {/* Summary bar */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
          <div className="w-12 h-12 rounded-xl bg-white/80 dark:bg-white/10 flex items-center justify-center shrink-0">
            <ShieldCheck className={cn('w-6 h-6', stats.pct === 100 ? 'text-green-500' : stats.overdue > 0 ? 'text-red-500' : 'text-amber-500')} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-th-text-primary tabular-nums">{stats.pct}%</span>
              <span className="text-sm text-th-text-secondary">compliant</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-th-text-tertiary">
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" />{stats.complete}/{stats.total} required</span>
              {stats.overdue > 0 && <span className="flex items-center gap-1 text-red-500"><AlertTriangle className="w-3 h-3" />{stats.overdue} overdue</span>}
            </div>
          </div>
          <div className="w-16 h-16 relative shrink-0">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.91" fill="none" stroke="currentColor" strokeWidth="2" className="text-surface-tertiary" />
              <circle cx="18" cy="18" r="15.91" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray={`${stats.pct} ${100 - stats.pct}`} className={stats.pct === 100 ? 'text-green-500' : 'text-th-accent-500'} strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Checklist */}
        <div className="max-h-[380px] overflow-y-auto space-y-3">
          {categories.map(([category, catItems]) => {
            const catComplete = catItems.filter((i) => i.status === 'complete').length;
            const expanded = expandedCategories.has(category);
            return (
              <div key={category} className="rounded-xl border border-th-border/50 overflow-hidden">
                <button onClick={() => toggleCategory(category)} className="w-full flex items-center gap-3 px-4 py-3 bg-surface-secondary/50 hover:bg-surface-secondary transition-colors">
                  {expanded ? <ChevronDown className="w-4 h-4 text-th-text-tertiary" /> : <ChevronRight className="w-4 h-4 text-th-text-tertiary" />}
                  <span className="text-sm font-semibold text-th-text-primary">{category}</span>
                  <span className="text-[10px] text-th-text-tertiary ml-auto tabular-nums">{catComplete}/{catItems.length}</span>
                </button>
                {expanded && (
                  <div className="divide-y divide-th-border/30">
                    {catItems.map((item) => {
                      const cfg = STATUS_CONFIG[item.status];
                      const Icon = cfg.icon;
                      return (
                        <div key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-secondary/20 transition-colors">
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', cfg.bg)}>
                            <Icon className={cn('w-4 h-4', cfg.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-th-text-primary">{item.name}</span>
                              {item.required && <span className="text-[9px] font-semibold text-red-500 uppercase">Required</span>}
                            </div>
                            <p className="text-xs text-th-text-tertiary mt-0.5">{item.description}</p>
                            {item.completedAt && (
                              <p className="text-[10px] text-th-text-tertiary mt-1 flex items-center gap-1">
                                <User className="w-3 h-3" />{item.completedBy} · {formatDate(item.completedAt)}
                              </p>
                            )}
                            {item.dueDate && item.status !== 'complete' && (
                              <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />Due: {formatDate(item.dueDate)}
                              </p>
                            )}
                          </div>
                          {item.status !== 'complete' && item.status !== 'not_required' && (
                            <button
                              onClick={() => handleMark(item.id)}
                              disabled={marking === item.id}
                              className="text-xs font-medium text-th-accent-500 hover:text-th-accent-600 px-2.5 py-1.5 rounded-lg hover:bg-th-accent-500/10 transition-colors shrink-0 disabled:opacity-50"
                            >
                              {marking === item.id ? '...' : 'Complete'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onExportAudit && (
            <button onClick={onExportAudit} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors">
              <Download className="w-4 h-4" />
              Export Audit Report
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium flex items-center gap-2">
            <Lock className="w-4 h-4" />
            {stats.pct === 100 ? 'Audit Ready' : 'Close'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
