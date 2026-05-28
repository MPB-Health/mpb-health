import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Loader2, X, Mail, MessageSquare, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';

interface CadenceOption {
  id: string;
  name: string;
  description: string | null;
  steps: Array<{ step: number; channel: string; day_offset: number; description?: string }>;
  is_active: boolean;
  halt_on_engagement: boolean;
  halt_on_optout: boolean;
}

const CHANNEL_ICON: Record<string, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  phone: Phone,
};

interface EnrollCadenceModalProps {
  open: boolean;
  onClose: () => void;
  leadIds: string[];
  onSuccess?: () => void;
}

export function EnrollCadenceModal({ open, onClose, leadIds, onSuccess }: EnrollCadenceModalProps) {
  const { activeOrgId } = useOrg();
  const [selectedCadence, setSelectedCadence] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const { data: cadences = [], isLoading } = useQuery({
    queryKey: ['cadencesForEnrollment', activeOrgId],
    enabled: open && !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_follow_up_cadences')
        .select('id, name, description, steps, is_active, halt_on_engagement, halt_on_optout')
        .eq('org_id', activeOrgId!)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data ?? []) as CadenceOption[];
    },
    staleTime: 30_000,
  });

  const handleEnroll = async () => {
    if (!selectedCadence || leadIds.length === 0) return;
    setEnrolling(true);
    let ok = 0;
    let failed = 0;
    for (const leadId of leadIds) {
      const { error } = await supabase.rpc('crm_enroll_lead_in_cadence', {
        p_lead_id: leadId,
        p_cadence_id: selectedCadence,
      });
      if (error) {
        failed++;
      } else {
        ok++;
      }
    }
    setEnrolling(false);
    if (ok > 0) {
      toast.success(`Enrolled ${ok} lead${ok !== 1 ? 's' : ''} in cadence`);
    }
    if (failed > 0) {
      toast.error(`${failed} enrollment${failed !== 1 ? 's' : ''} failed`);
    }
    onSuccess?.();
    onClose();
  };

  if (!open) return null;

  const selected = cadences.find((c) => c.id === selectedCadence);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface-primary rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-th-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-th-accent-600" />
            <h2 className="text-base font-semibold text-th-text-primary">
              Enroll in Cadence
            </h2>
            <span className="text-xs bg-th-accent-50 text-th-accent-700 px-2 py-0.5 rounded-full font-medium">
              {leadIds.length} lead{leadIds.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-surface-secondary">
            <X className="w-4 h-4 text-th-text-secondary" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-th-text-tertiary">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading cadences…
            </div>
          ) : cadences.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-th-text-tertiary mx-auto mb-2 opacity-40" />
              <p className="text-sm text-th-text-secondary">No active cadences found.</p>
              <p className="text-xs text-th-text-tertiary mt-1">Create a cadence under Settings → Automation first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cadences.map((c) => {
                const isSelected = selectedCadence === c.id;
                const steps = Array.isArray(c.steps) ? c.steps : [];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCadence(isSelected ? null : c.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-th-accent-600 bg-th-accent-50 ring-1 ring-th-accent-600'
                        : 'border-th-border hover:border-th-accent-300 hover:bg-surface-secondary'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-semibold text-th-text-primary">{c.name}</p>
                      <span className="text-xs text-th-text-tertiary">{steps.length} steps</span>
                    </div>
                    {c.description && (
                      <p className="text-xs text-th-text-tertiary mb-2 line-clamp-2">{c.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-th-text-secondary">
                      {steps.slice(0, 4).map((s) => {
                        const Icon = CHANNEL_ICON[s.channel] || Mail;
                        return (
                          <span key={s.step} className="flex items-center gap-1">
                            <Icon className="w-3 h-3" />
                            Day {s.day_offset}
                          </span>
                        );
                      })}
                      {steps.length > 4 && <span>+{steps.length - 4} more</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Preview selected cadence steps */}
          {selected && (
            <div className="mt-4 p-3 bg-surface-secondary rounded-lg">
              <p className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider mb-2">
                Steps
              </p>
              <div className="space-y-1.5">
                {(Array.isArray(selected.steps) ? selected.steps : []).map((s) => {
                  const Icon = CHANNEL_ICON[s.channel] || Mail;
                  return (
                    <div key={s.step} className="flex items-center gap-2 text-xs text-th-text-secondary">
                      <span className="w-5 h-5 rounded bg-surface-primary flex items-center justify-center text-th-text-tertiary font-medium">
                        {s.step}
                      </span>
                      <Icon className="w-3 h-3" />
                      <span className="capitalize">{s.channel}</span>
                      <span className="text-th-text-tertiary">· Day {s.day_offset}</span>
                      {s.description && (
                        <span className="text-th-text-tertiary truncate">— {s.description}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-th-border text-xs text-th-text-tertiary">
                {selected.halt_on_engagement && <span>Halts on engagement</span>}
                {selected.halt_on_optout && <span>Halts on opt-out</span>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-th-border px-6 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-th-border rounded-lg hover:bg-surface-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleEnroll}
            disabled={!selectedCadence || enrolling}
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
          >
            {enrolling ? 'Enrolling…' : `Enroll ${leadIds.length} Lead${leadIds.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
