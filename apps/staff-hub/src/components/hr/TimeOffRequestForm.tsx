import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  REQUEST_TYPE_META,
  createRequest,
  documentKindForType,
  uploadDocument,
  type StaffTimeRequestType,
} from '../../lib/hr';
import { HrBezel, HrPrimaryButton, HrSecondaryButton } from './HrChrome';
import { PendingFileChip } from './DocumentUpload';

const TYPES = Object.keys(REQUEST_TYPE_META) as StaffTimeRequestType[];

function toIsoLocal(date: string, time: string, allDay: boolean, endOfDay = false): string {
  if (allDay) {
    const d = new Date(`${date}T${endOfDay ? '23:59:59' : '00:00:00'}`);
    return d.toISOString();
  }
  return new Date(`${date}T${time}:00`).toISOString();
}

export function TimeOffRequestForm({
  initialDate,
}: {
  initialDate?: string;
}) {
  const navigate = useNavigate();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [type, setType] = useState<StaffTimeRequestType>('pto');
  const [allDay, setAllDay] = useState(true);
  const [startDate, setStartDate] = useState(initialDate || today);
  const [endDate, setEndDate] = useState(initialDate || today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [ack, setAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const needsAck = type === 'sick' || type === 'doctor_appointment';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsAck && !ack) {
      toast.error('Please confirm the acknowledgment');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date must be on or after start date');
      return;
    }

    setSubmitting(true);
    try {
      const { request, notifyDelayed } = await createRequest({
        type,
        all_day: allDay,
        starts_at: toIsoLocal(startDate, startTime, allDay, false),
        ends_at: toIsoLocal(endDate, endTime, allDay, true),
        reason,
      });

      const kind = documentKindForType(type);
      for (const file of files) {
        await uploadDocument(request.id, { file, kind });
      }

      if (notifyDelayed) {
        toast.success('Request saved. HR email may be delayed.');
      } else {
        toast.success('Request submitted to HR');
      }
      navigate(`/time-off/${request.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HrBezel>
      <form onSubmit={onSubmit} className="space-y-8 p-6 sm:p-8">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">Request type</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {TYPES.map((t) => {
              const meta = REQUEST_TYPE_META[t];
              const selected = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-2xl px-3 py-3 text-left text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    selected
                      ? `${meta.bg} ${meta.color} ring-2 ring-[#0A4E8E]/30`
                      : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <span className={`mb-1.5 block h-2 w-2 rounded-full ${meta.dot}`} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={allDay}
            onClick={() => setAllDay((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              allDay ? 'bg-[#0A4E8E]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                allDay ? 'translate-x-5' : ''
              }`}
            />
          </button>
          <span className="text-sm text-slate-700">All-day request</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor="start-date">
              Start date
            </label>
            <input
              id="start-date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor="end-date">
              End date
            </label>
            <input
              id="end-date"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/40"
            />
          </div>
          {!allDay && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor="start-time">
                  Start time
                </label>
                <input
                  id="start-time"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/40"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor="end-time">
                  End time
                </label>
                <input
                  id="end-time"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/40"
                />
              </div>
            </>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor="reason">
            Notes for HR <span className="font-normal text-slate-400">(optional · private)</span>
          </label>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Visible to you and HR only - not shown on the team calendar."
            className="w-full resize-y rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/40"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-800">
            Attach documents <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const next = Array.from(e.target.files ?? []);
              setFiles((prev) => [...prev, ...next]);
              e.target.value = '';
            }}
            className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          {files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <PendingFileChip
                  key={`${f.name}-${i}`}
                  name={f.name}
                  onRemove={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                />
              ))}
            </div>
          )}
        </div>

        {needsAck && (
          <label className="flex items-start gap-3 rounded-2xl bg-rose-50/60 p-4 text-sm text-rose-900 ring-1 ring-rose-100">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I confirm this request may include a doctor&apos;s note or medical documentation for HR
              review. Notes stay private to me and HR.
            </span>
          </label>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <HrPrimaryButton type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                Submit to HR
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-px">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </>
            )}
          </HrPrimaryButton>
          <Link to="/time-off">
            <HrSecondaryButton type="button">Cancel</HrSecondaryButton>
          </Link>
        </div>
      </form>
    </HrBezel>
  );
}
