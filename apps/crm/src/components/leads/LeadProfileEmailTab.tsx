import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Mail, Reply, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { EmailComposer, type EmailComposerHandle } from '../email/EmailComposer';
import { formatTimeAgo } from '@mpbhealth/crm-core';
import type { Lead } from '@mpbhealth/crm-core';

interface LeadProfileEmailTabProps {
  lead: Lead;
}

/**
 * Round 10 — Lead Profile action-row contract. Lets the parent scroll the
 * tab into view AND focus the body editor in one shot when the rep clicks
 * the top-row Email button (or a scheduled email task fires).
 */
export interface LeadProfileEmailTabHandle {
  scrollIntoViewAndFocus: () => void;
}

interface ThreadMessageRow {
  id: string;
  subject: string | null;
  from_email: string | null;
  to_email: string | null;
  body_html: string | null;
  body_text: string | null;
  sent_at: string | null;
  created_at: string;
  direction: 'inbound' | 'outbound' | null;
  thread_id: string | null;
}

/**
 * Section 6 / Round 5 — In-profile email composer + thread.
 *
 * Renders an embedded EmailComposer pre-filled to the lead, plus the most
 * recent message thread for that lead. Sending here logs the message to the
 * CRM (via `crm-send-email`) so it shows in the timeline. Reps never need to
 * leave the profile to email a lead.
 */
export const LeadProfileEmailTab = forwardRef<LeadProfileEmailTabHandle, LeadProfileEmailTabProps>(
  function LeadProfileEmailTab({ lead }, ref) {
  const queryClient = useQueryClient();
  const [composerKey, setComposerKey] = useState(0);
  const [replyTo, setReplyTo] = useState<ThreadMessageRow | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<EmailComposerHandle>(null);

  useImperativeHandle(
    ref,
    () => ({
      scrollIntoViewAndFocus: () => {
        // Two rAFs so the layout settles after the parent flips activeTab to
        // 'email' (Suspense boundary or conditional render). Without this the
        // scroll runs before the composer is in the DOM.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            composerRef.current?.focus();
          });
        });
      },
    }),
    [],
  );

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['leadEmailMessages', lead.id],
    enabled: !!lead?.id,
    queryFn: async () => {
      // Pull recent inbound + outbound emails associated with this lead so
      // reps can see context and quickly reply. We tolerate either
      // `lead_id` or `entity_id` columns since the email log table has
      // evolved; only fields we know are universal are projected.
      const { data, error } = await supabase
        .from('email_messages')
        .select(
          'id, subject, from_email, to_email, body_html, body_text, sent_at, created_at, direction, thread_id'
        )
        .or(`lead_id.eq.${lead.id},to_email.eq.${lead.email ?? ''}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // The table may not exist in some environments yet — fall back to
        // empty so the composer still renders.
        console.warn('[LeadProfileEmailTab] email_messages query failed:', error.message);
        return [] as ThreadMessageRow[];
      }
      return (data ?? []) as ThreadMessageRow[];
    },
    staleTime: 30_000,
  });

  const initialTo = useMemo(() => (lead.email ? [lead.email] : []), [lead.email]);
  const initialSubject = useMemo(() => {
    if (replyTo?.subject) {
      return replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`;
    }
    return '';
  }, [replyTo?.subject]);

  const mergeTokens = useMemo(() => {
    const l = lead as unknown as Record<string, unknown>;
    return {
      '#lead name': `${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim(),
      '#firstname': lead.first_name ?? '',
      '#lastname': lead.last_name ?? '',
      '#plan': String(l.plan_type ?? ''),
      '#quote price': l.monthly_premium != null ? `$${l.monthly_premium}` : '',
      '#yoursignature': '',
    };
  }, [lead]);

  if (!lead.email) {
    return (
      <div className="text-center py-12">
        <Mail className="w-10 h-10 text-th-text-tertiary mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium text-th-text-secondary">
          No email on file for this lead
        </p>
        <p className="text-xs text-th-text-tertiary mt-1">
          Add a primary email to the contact card to enable in-profile sending.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={wrapperRef}>
      {/* Composer card */}
      <div className="bg-surface-secondary/40 border border-th-border rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2 text-xs text-th-text-tertiary">
          <Mail className="w-3.5 h-3.5" />
          {replyTo
            ? `Replying to "${replyTo.subject || '(no subject)'}"`
            : `Compose email to ${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim()}
        </div>
        <EmailComposer
          key={composerKey}
          ref={composerRef}
          mode={replyTo ? 'reply' : 'compose'}
          replyToEmailId={replyTo?.id}
          leadId={lead.id}
          initialTo={initialTo}
          initialSubject={initialSubject}
          mergeTokens={mergeTokens}
          onSent={() => {
            toast.success('Email sent');
            setReplyTo(null);
            setComposerKey((k) => k + 1);
            queryClient.invalidateQueries({ queryKey: ['leadEmailMessages', lead.id] });
            queryClient.invalidateQueries({ queryKey: ['leadActivities', lead.id] });
          }}
          onDiscard={() => {
            setReplyTo(null);
            setComposerKey((k) => k + 1);
          }}
        />
      </div>

      {/* Recent messages */}
      <div>
        <h3 className="text-sm font-semibold text-th-text-primary mb-3">
          Recent messages
        </h3>
        {isLoading ? (
          <div className="text-xs text-th-text-tertiary">Loading thread…</div>
        ) : messages.length === 0 ? (
          <div className="text-xs text-th-text-tertiary">
            No emails logged for this lead yet. New sends will appear here.
          </div>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => (
              <li
                key={m.id}
                className="border border-th-border rounded-xl p-3 bg-surface-primary"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-xs font-medium text-th-text-secondary truncate">
                    {m.direction === 'inbound' ? '← From ' : '→ To '}
                    {m.direction === 'inbound' ? m.from_email : m.to_email}
                  </div>
                  <div className="text-[11px] text-th-text-tertiary shrink-0">
                    {formatTimeAgo(m.sent_at || m.created_at)}
                  </div>
                </div>
                <div className="text-sm font-semibold text-th-text-primary truncate">
                  {m.subject || '(no subject)'}
                </div>
                <div className="text-xs text-th-text-tertiary line-clamp-2 mt-1">
                  {m.body_text || stripHtml(m.body_html || '')}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setReplyTo(m)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-th-accent-600 hover:text-th-accent-700"
                  >
                    <Reply className="w-3 h-3" /> Reply
                  </button>
                  {m.thread_id && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-th-text-tertiary">
                      <ChevronRight className="w-3 h-3" /> thread {m.thread_id.slice(0, 8)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
  },
);

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default LeadProfileEmailTab;
