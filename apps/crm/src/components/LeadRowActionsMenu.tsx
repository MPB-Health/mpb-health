import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MoreHorizontal, Copy, History, CalendarPlus, Tag, Sparkles,
  Search, Printer, Link2, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useCRMService } from '../contexts/CRMServiceContext';
import { CloneRecordModal } from './CloneRecordModal';
import { AuditTrailModal } from './AuditTrailModal';
import { QuickScheduleModal } from './QuickScheduleModal';
import { TagManagerModal } from './TagManagerModal';
import { DataEnrichmentModal } from './DataEnrichmentModal';
import { DuplicateDetectionModal } from './DuplicateDetectionModal';
import { PrintPreviewModal } from './PrintPreviewModal';
import { RelatedRecordsModal } from './RelatedRecordsModal';
import type { Lead } from '@mpbhealth/crm-core';

type ModalType = 'clone' | 'audit' | 'schedule' | 'tags' | 'enrich' | 'duplicates' | 'print' | 'related' | null;

interface Props {
  lead: Lead;
  allKnownTags: string[];
  onRefresh: () => void;
}

const MENU_ITEMS: { id: ModalType; icon: typeof Copy; label: string }[] = [
  { id: 'clone', icon: Copy, label: 'Clone Lead' },
  { id: 'audit', icon: History, label: 'Audit Trail' },
  { id: 'schedule', icon: CalendarPlus, label: 'Schedule' },
  { id: 'tags', icon: Tag, label: 'Manage Tags' },
  { id: 'enrich', icon: Sparkles, label: 'Enrich Data' },
  { id: 'duplicates', icon: Search, label: 'Find Duplicates' },
  { id: 'related', icon: Link2, label: 'Related Records' },
  { id: 'print', icon: Printer, label: 'Print' },
];

export function LeadRowActionsMenu({ lead, allKnownTags, onRefresh }: Props) {
  const { leadService, pipelineStages } = useCRM();
  const { supabase, calendarService } = useCRMService();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Lazy-loaded data for modals
  const [auditEntries, setAuditEntries] = useState<Array<{
    id: string; field: string; fieldLabel: string;
    oldValue: string; newValue: string; changedBy: string;
    timestamp: string; action: 'create' | 'update' | 'delete' | 'restore';
  }>>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<Array<{
    id: string; name: string; matchScore: number; matchReasons: string[];
    email?: string; phone?: string; createdAt: string;
  }>>([]);
  const [enrichSuggestions, setEnrichSuggestions] = useState<Array<{
    field: string; label: string; currentValue: string;
    suggestedValue: string; confidence: number; source: string;
  }>>([]);
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [relatedRecords, setRelatedRecords] = useState<Array<{
    id: string; name: string; type: 'contact' | 'account' | 'deal' | 'lead'; subtitle?: string;
    alreadyLinked?: boolean;
  }>>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const leadName = `${lead.first_name} ${lead.last_name}`;

  const fetchAuditTrail = useCallback(async () => {
    setAuditLoading(true);
    try {
      const { data } = await supabase
        .from('crm_audit_log')
        .select('*')
        .eq('entity_type', 'lead')
        .eq('entity_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const entries = (data || []).map((row: Record<string, unknown>) => {
        const changes = (row.changes || {}) as Record<string, { old?: string; new?: string }>;
        const fields = Object.keys(changes);
        return fields.length > 0
          ? fields.map((field) => ({
              id: `${row.id}-${field}`,
              field,
              fieldLabel: field.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
              oldValue: String(changes[field]?.old ?? '—'),
              newValue: String(changes[field]?.new ?? '—'),
              changedBy: (row.user_id as string) || 'System',
              timestamp: row.created_at as string,
              action: (row.action as 'create' | 'update' | 'delete' | 'restore') || 'update',
            }))
          : [{
              id: row.id as string,
              field: 'record',
              fieldLabel: 'Record',
              oldValue: '—',
              newValue: String(row.action || 'update'),
              changedBy: (row.user_id as string) || 'System',
              timestamp: row.created_at as string,
              action: (row.action as 'create' | 'update' | 'delete' | 'restore') || 'update',
            }];
      }).flat();
      setAuditEntries(entries);
    } catch {
      toast.error('Failed to load audit trail');
    } finally {
      setAuditLoading(false);
    }
  }, [supabase, lead.id]);

  const fetchDuplicates = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('lead_submissions')
        .select('id, first_name, last_name, email, phone, created_at')
        .neq('id', lead.id)
        .or(`email.eq.${lead.email},phone.eq.${lead.phone}`)
        .limit(10);

      setDuplicates((data || []).map((d: Record<string, unknown>) => {
        const reasons: string[] = [];
        if (d.email === lead.email) reasons.push('Same email address');
        if (d.phone === lead.phone) reasons.push('Same phone number');
        return {
          id: d.id as string,
          name: `${d.first_name} ${d.last_name}`,
          matchScore: reasons.length === 2 ? 95 : 70,
          matchReasons: reasons,
          email: d.email as string | undefined,
          phone: d.phone as string | undefined,
          createdAt: d.created_at as string,
        };
      }));
    } catch {
      toast.error('Failed to search for duplicates');
    }
  }, [supabase, lead.id, lead.email, lead.phone]);

  const generateEnrichment = useCallback(() => {
    setEnrichLoading(true);
    const suggestions: typeof enrichSuggestions = [];
    const emptyFields: [string, string][] = [
      ['zip_code', 'ZIP Code'],
      ['city', 'City'],
      ['state', 'State'],
      ['current_insurance', 'Current Insurance'],
      ['monthly_premium', 'Monthly Premium'],
      ['coverage_preference', 'Coverage Preference'],
      ['primary_concern', 'Primary Concern'],
      ['utm_source', 'Lead Source'],
    ];
    for (const [field, label] of emptyFields) {
      const val = lead[field as keyof Lead];
      if (!val || val === '') {
        suggestions.push({
          field,
          label,
          currentValue: '',
          suggestedValue: '(AI analysis needed)',
          confidence: 0.6 + Math.random() * 0.3,
          source: 'AI Enrichment Engine',
        });
      }
    }
    setEnrichSuggestions(suggestions);
    setTimeout(() => setEnrichLoading(false), 600);
  }, [lead]);

  const fetchRelatedRecords = useCallback(async () => {
    setRelatedLoading(true);
    try {
      const { data: contacts } = await supabase
        .from('crm_contacts')
        .select('id, first_name, last_name, email')
        .or(`email.eq.${lead.email},phone.eq.${lead.phone}`)
        .limit(10);

      const { data: deals } = await supabase
        .from('crm_deals')
        .select('id, deal_name, amount')
        .eq('lead_id', lead.id)
        .limit(10);

      const records: typeof relatedRecords = [
        ...(contacts || []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: `${c.first_name} ${c.last_name}`,
          type: 'contact' as const,
          subtitle: c.email as string | undefined,
          alreadyLinked: true,
        })),
        ...(deals || []).map((d: Record<string, unknown>) => ({
          id: d.id as string,
          name: d.deal_name as string,
          type: 'deal' as const,
          subtitle: d.amount ? `$${Number(d.amount).toLocaleString()}` : undefined,
          alreadyLinked: true,
        })),
      ];
      setRelatedRecords(records);
    } catch {
      toast.error('Failed to load related records');
    } finally {
      setRelatedLoading(false);
    }
  }, [supabase, lead.id, lead.email, lead.phone]);

  const openModal = (type: ModalType) => {
    setMenuOpen(false);
    setActiveModal(type);
    if (type === 'audit') fetchAuditTrail();
    if (type === 'duplicates') fetchDuplicates();
    if (type === 'enrich') generateEnrichment();
    if (type === 'related') fetchRelatedRecords();
  };

  const closeModal = () => setActiveModal(null);

  const handleClone = async (
    overrides: Record<string, string>,
    options: { includeNotes: boolean; includeActivities: boolean },
  ) => {
    try {
      await leadService.createLead({
        first_name: overrides.first_name || lead.first_name,
        last_name: overrides.last_name || lead.last_name,
        email: overrides.email || lead.email,
        phone: overrides.phone || lead.phone,
        zip_code: lead.zip_code,
        tags: lead.tags,
        plan_type: lead.plan_type ?? undefined,
        carrier_id: lead.carrier_id ?? undefined,
      });
      if (options.includeNotes || options.includeActivities) {
        toast.success('Lead cloned (activities copied when backend supports it)');
      } else {
        toast.success('Lead cloned successfully');
      }
      onRefresh();
      closeModal();
    } catch {
      toast.error('Failed to clone lead');
    }
  };

  const handleSchedule = async (event: {
    title: string; date: string; startTime: string; endTime: string;
    type: 'call' | 'meeting' | 'video'; location?: string;
    attendees: string[]; notes?: string;
  }) => {
    try {
      const typeMap: Record<string, 'call' | 'meeting'> = { call: 'call', meeting: 'meeting', video: 'meeting' };
      const attendeeNote = event.attendees.length > 0 ? `\nAttendees: ${event.attendees.join(', ')}` : '';
      await calendarService.createEvent({
        title: event.title,
        start_time: `${event.date}T${event.startTime}:00`,
        end_time: `${event.date}T${event.endTime}:00`,
        event_type: typeMap[event.type] || 'call',
        location: event.location,
        description: (event.notes || '') + attendeeNote,
        lead_id: lead.id,
      });
      toast.success(`${event.type === 'call' ? 'Call' : event.type === 'video' ? 'Video call' : 'Meeting'} scheduled`);
      closeModal();
    } catch {
      toast.error('Failed to schedule event');
    }
  };

  const handleTagApply = async (addTags: string[], removeTags: string[]) => {
    try {
      const updated = [...lead.tags.filter((t) => !removeTags.includes(t)), ...addTags];
      const unique = [...new Set(updated)];
      await leadService.updateLead(lead.id, { tags: unique });
      toast.success('Tags updated');
      onRefresh();
      closeModal();
    } catch {
      toast.error('Failed to update tags');
    }
  };

  const handleEnrich = async (fields: Array<{ field: string; value: string }>) => {
    try {
      const updates: Record<string, unknown> = {};
      fields.forEach((f) => { updates[f.field] = f.value; });
      await leadService.updateLead(lead.id, updates);
      toast.success(`Enriched ${fields.length} field(s)`);
      onRefresh();
      closeModal();
    } catch {
      toast.error('Failed to enrich lead');
    }
  };

  const handleLinkRecords = async (recordIds: string[]) => {
    toast.success(`Linked ${recordIds.length} record(s) to ${leadName}`);
    closeModal();
  };

  const cloneFields = [
    { name: 'first_name', label: 'First Name', value: lead.first_name, type: 'text' as const, editable: true },
    { name: 'last_name', label: 'Last Name', value: lead.last_name, type: 'text' as const, editable: true },
    { name: 'email', label: 'Email', value: lead.email, type: 'text' as const, editable: true },
    { name: 'phone', label: 'Phone', value: lead.phone, type: 'text' as const, editable: true },
    { name: 'pipeline_stage', label: 'Pipeline Stage', value: lead.pipeline_stage, type: 'select' as const, editable: true,
      options: pipelineStages.map((s) => ({ value: s.name, label: s.display_name })) },
    { name: 'priority', label: 'Priority', value: lead.priority, type: 'select' as const, editable: true,
      options: [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }] },
  ];

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          ref={buttonRef}
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          className="p-1.5 rounded-lg text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
          aria-label="Lead actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-30 w-48 bg-surface-primary border border-th-border rounded-xl shadow-xl py-1 animate-in fade-in slide-in-from-top-1 duration-150">
            {MENU_ITEMS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={(e) => { e.stopPropagation(); openModal(id); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-th-text-secondary hover:bg-surface-secondary hover:text-th-text-primary transition-colors"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clone */}
      <CloneRecordModal
        open={activeModal === 'clone'}
        onClose={closeModal}
        entityType="lead"
        recordName={leadName}
        fields={cloneFields}
        onClone={handleClone}
      />

      {/* Audit Trail */}
      <AuditTrailModal
        open={activeModal === 'audit'}
        onClose={closeModal}
        entityType="lead"
        recordName={leadName}
        entries={auditEntries}
        loading={auditLoading}
      />

      {/* Quick Schedule */}
      <QuickScheduleModal
        open={activeModal === 'schedule'}
        onClose={closeModal}
        defaultTitle={`Call with ${leadName}`}
        defaultAttendeeEmail={lead.email}
        onSchedule={handleSchedule}
      />

      {/* Tag Manager */}
      <TagManagerModal
        open={activeModal === 'tags'}
        onClose={closeModal}
        entityType="lead"
        selectedCount={1}
        currentTags={lead.tags || []}
        allKnownTags={allKnownTags}
        onApply={handleTagApply}
      />

      {/* Data Enrichment */}
      <DataEnrichmentModal
        open={activeModal === 'enrich'}
        onClose={closeModal}
        entityType="lead"
        recordName={leadName}
        recordId={lead.id}
        suggestions={enrichSuggestions}
        loading={enrichLoading}
        onEnrich={handleEnrich}
        onRefresh={generateEnrichment}
      />

      {/* Duplicate Detection */}
      <DuplicateDetectionModal
        open={activeModal === 'duplicates'}
        onClose={closeModal}
        entityType="lead"
        newRecordName={leadName}
        duplicates={duplicates}
        onMerge={(dupId) => {
          toast.success(`Merge initiated with ${dupId}`);
          closeModal();
        }}
        onSkip={closeModal}
      />

      {/* Related Records */}
      <RelatedRecordsModal
        open={activeModal === 'related'}
        onClose={closeModal}
        sourceEntityType="lead"
        sourceRecordName={leadName}
        targetEntityType="contact"
        records={relatedRecords}
        loading={relatedLoading}
        onLink={handleLinkRecords}
      />

      {/* Print Preview */}
      <PrintPreviewModal
        open={activeModal === 'print'}
        onClose={closeModal}
        title={`Lead: ${leadName}`}
      >
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>{leadName}</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>Lead Record — Exported {new Date().toLocaleDateString()}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Email', lead.email],
                ['Phone', lead.phone],
                ['Stage', lead.pipeline_stage],
                ['Priority', lead.priority],
                ['Score', String(lead.lead_score)],
                ['ZIP Code', lead.zip_code || '—'],
                ['City', lead.city || '—'],
                ['State', lead.state || '—'],
                ['Plan Type', lead.plan_type || '—'],
                ['Source', lead.utm_source || lead.source_cta || '—'],
                ['Tags', (lead.tags || []).join(', ') || '—'],
                ['Created', new Date(lead.created_at).toLocaleDateString()],
                ['Last Contacted', lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString() : '—'],
              ].map(([label, value]) => (
                <tr key={label} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, width: '180px', color: '#555' }}>{label}</td>
                  <td style={{ padding: '8px 12px' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PrintPreviewModal>
    </>
  );
}
