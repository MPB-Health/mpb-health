import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@mpbhealth/database';
import { useTenant } from '@mpbhealth/auth';
import {
  cancelRequest,
  checkIsStaffHr,
  decideRequest,
  getDocumentSignedUrl,
  getRequest,
  listDocuments,
  type StaffTimeDocument,
  type StaffTimeRequest,
} from '../lib/hr';
import { HrBezel, HrPageHeader, HrPrimaryButton, HrSecondaryButton } from '../components/hr/HrChrome';
import { StatusBadge, TypeBadge } from '../components/hr/StatusBadge';
import { DocumentList, DocumentUpload } from '../components/hr/DocumentUpload';

function formatRange(r: StaffTimeRequest): string {
  const start = parseISO(r.starts_at);
  const end = parseISO(r.ends_at);
  if (r.all_day) {
    return `${format(start, 'EEE, MMM d, yyyy')} - ${format(end, 'EEE, MMM d, yyyy')} · all day`;
  }
  return `${format(start, 'EEE, MMM d, yyyy h:mm a')} - ${format(end, 'EEE, MMM d h:mm a')}`;
}

export default function TimeOffDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orgId, loading: tenantLoading } = useTenant();
  const [request, setRequest] = useState<StaffTimeRequest | null>(null);
  const [docs, setDocs] = useState<StaffTimeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHr, setIsHr] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [acting, setActing] = useState(false);

  const reload = async () => {
    if (!id) return;
    const [row, documents] = await Promise.all([getRequest(id), listDocuments(id)]);
    setRequest(row);
    setDocs(documents);
  };

  useEffect(() => {
    if (tenantLoading || !orgId || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!cancelled) {
          setUserId(user?.id ?? null);
          setIsHr(checkIsStaffHr(user?.email));
        }
        await reload();
      } catch {
        toast.error('Could not load request');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantLoading, orgId, id]);

  const isOwner = Boolean(request && userId && request.user_id === userId);

  const onCancel = async () => {
    if (!request) return;
    setActing(true);
    try {
      const updated = await cancelRequest(request.id);
      setRequest(updated);
      toast.success('Request cancelled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setActing(false);
    }
  };

  const onDecide = async (status: 'approved' | 'denied') => {
    if (!request) return;
    setActing(true);
    try {
      const { request: updated, notifyDelayed } = await decideRequest(request.id, {
        status,
        decision_note: decisionNote,
      });
      setRequest(updated);
      toast.success(
        notifyDelayed
          ? `${status === 'approved' ? 'Approved' : 'Denied'}. Employee email may be delayed.`
          : status === 'approved'
            ? 'Approved - employee notified'
            : 'Denied - employee notified',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Decision failed');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#0A4E8E]" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-600">Request not found.</p>
        <button
          type="button"
          className="mt-4 text-sm text-[#0A4E8E]"
          onClick={() => navigate('/time-off')}
        >
          Back to my requests
        </button>
      </div>
    );
  }

  return (
    <div className="hr-surface mx-auto max-w-3xl animate-fade-up space-y-6">
      <Link
        to="/time-off"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        My requests
      </Link>

      <HrPageHeader
        title={request.title || 'Time-off request'}
        subtitle={formatRange(request)}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={request.type} />
            <StatusBadge status={request.status} />
          </div>
        }
      />

      <HrBezel>
        <div className="space-y-6 p-6 sm:p-8">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Employee</dt>
              <dd className="mt-1 text-sm text-slate-900">{request.employee_name}</dd>
              <dd className="text-xs text-slate-500">{request.employee_email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Submitted</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {format(parseISO(request.created_at), 'MMM d, yyyy h:mm a')}
              </dd>
            </div>
          </dl>

          {(isOwner || isHr) && request.reason && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Notes for HR
              </h3>
              <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                {request.reason}
              </p>
            </div>
          )}

          {request.decision_note && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">
                HR decision note
              </h3>
              <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                {request.decision_note}
              </p>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Documents</h3>
            <DocumentList
              docs={docs}
              onOpen={async (doc) => {
                try {
                  const url = await getDocumentSignedUrl(doc.storage_path);
                  window.open(url, '_blank', 'noopener,noreferrer');
                } catch {
                  toast.error('Could not open file');
                }
              }}
            />
            {isOwner && request.status === 'pending' && (
              <div className="mt-4">
                <DocumentUpload
                  requestId={request.id}
                  requestType={request.type}
                  onUploaded={(doc) => setDocs((prev) => [...prev, doc])}
                />
              </div>
            )}
          </div>

          {isOwner && request.status === 'pending' && (
            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
              <HrSecondaryButton type="button" disabled={acting} onClick={() => void onCancel()}>
                Cancel request
              </HrSecondaryButton>
            </div>
          )}

          {isHr && request.status === 'pending' && (
            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-semibold text-slate-800">HR decision</h3>
              <textarea
                rows={2}
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Optional note to the employee"
                className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/40"
              />
              <div className="flex flex-wrap gap-3">
                <HrPrimaryButton
                  type="button"
                  disabled={acting}
                  onClick={() => void onDecide('approved')}
                  className="!bg-emerald-600 hover:!bg-emerald-700"
                >
                  Approve
                </HrPrimaryButton>
                <HrSecondaryButton
                  type="button"
                  disabled={acting}
                  onClick={() => void onDecide('denied')}
                  className="!text-rose-700 !ring-rose-200 hover:!bg-rose-50"
                >
                  Deny
                </HrSecondaryButton>
              </div>
            </div>
          )}
        </div>
      </HrBezel>
    </div>
  );
}
