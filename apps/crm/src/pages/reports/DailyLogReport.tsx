import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { GradientHeader } from '@mpbhealth/ui';
import { Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { supabase } from '../../lib/supabase';

export default function DailyLogReport() {
  const { user } = useAuth();
  const { activeOrgId } = useOrg();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [logDate, setLogDate] = useState(today);
  const [calls, setCalls] = useState(0);
  const [emails, setEmails] = useState(0);
  const [li, setLi] = useState(0);
  const [meetings, setMeetings] = useState(0);
  const [worked, setWorked] = useState(0);
  const [notes, setNotes] = useState('');

  const { data: rows = [] } = useQuery({
    queryKey: ['crmDailyLog', activeOrgId, user?.id],
    queryFn: async () => {
      if (!activeOrgId || !user?.id) return [];
      const { data, error } = await supabase
        .from('crm_rep_daily_log_entries')
        .select('*')
        .eq('org_id', activeOrgId)
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeOrgId && !!user?.id,
  });

  useEffect(() => {
    const r = rows.find((x: Record<string, unknown>) => String(x.log_date) === logDate);
    if (r) {
      setCalls(Number(r.calls_made) || 0);
      setEmails(Number(r.emails_sent) || 0);
      setLi(Number(r.linkedin_touches) || 0);
      setMeetings(Number(r.meetings_held) || 0);
      setWorked(Number(r.leads_worked) || 0);
      setNotes(typeof r.notes === 'string' ? r.notes : '');
    } else {
      setCalls(0);
      setEmails(0);
      setLi(0);
      setMeetings(0);
      setWorked(0);
      setNotes('');
    }
  }, [logDate, rows]);

  const save = async () => {
    if (!activeOrgId || !user?.id) return;
    const { error } = await supabase.from('crm_rep_daily_log_entries').upsert(
      {
        org_id: activeOrgId,
        user_id: user.id,
        log_date: logDate,
        calls_made: calls,
        emails_sent: emails,
        linkedin_touches: li,
        meetings_held: meetings,
        leads_worked: worked,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,user_id,log_date' },
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Daily log saved');
    qc.invalidateQueries({ queryKey: ['crmDailyLog', activeOrgId, user.id] });
  };

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Daily activity log"
        subtitle="Sales team daily log — replaces spreadsheet rollups for call counts and touches."
      />
      <div className="bg-surface-primary rounded-2xl border border-th-border p-6 max-w-2xl space-y-4">
        <div className="flex items-center gap-2 text-sm text-th-text-tertiary">
          <Calendar className="w-4 h-4" />
          <input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className="border border-th-border rounded-lg px-2 py-1 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-th-text-tertiary">
            Calls
            <input type="number" value={calls} onChange={(e) => setCalls(+e.target.value || 0)} className="mt-1 w-full border rounded-lg px-2 py-1 text-sm" min={0} />
          </label>
          <label className="text-xs text-th-text-tertiary">
            Emails sent
            <input type="number" value={emails} onChange={(e) => setEmails(+e.target.value || 0)} className="mt-1 w-full border rounded-lg px-2 py-1 text-sm" min={0} />
          </label>
          <label className="text-xs text-th-text-tertiary">
            LinkedIn touches
            <input type="number" value={li} onChange={(e) => setLi(+e.target.value || 0)} className="mt-1 w-full border rounded-lg px-2 py-1 text-sm" min={0} />
          </label>
          <label className="text-xs text-th-text-tertiary">
            Meetings
            <input type="number" value={meetings} onChange={(e) => setMeetings(+e.target.value || 0)} className="mt-1 w-full border rounded-lg px-2 py-1 text-sm" min={0} />
          </label>
          <label className="text-xs text-th-text-tertiary col-span-2">
            Leads worked
            <input type="number" value={worked} onChange={(e) => setWorked(+e.target.value || 0)} className="mt-1 w-full border rounded-lg px-2 py-1 text-sm" min={0} />
          </label>
        </div>
        <label className="block text-xs text-th-text-tertiary">
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full border rounded-lg px-2 py-1 text-sm" />
        </label>
        <button type="button" onClick={save} className="px-4 py-2 rounded-xl bg-th-accent-600 text-white text-sm font-medium">
          Save entry
        </button>
      </div>

      <div className="bg-surface-primary rounded-2xl border border-th-border p-6">
        <h2 className="text-sm font-semibold text-th-text-primary mb-3">Recent entries</h2>
        <ul className="text-sm space-y-2 text-th-text-secondary">
          {rows.length === 0 ? <li className="text-th-text-tertiary">No rows yet</li> : null}
          {rows.map((r: Record<string, unknown>) => (
            <li key={String(r.id)} className="border-b border-th-border/40 pb-2">
              <span className="font-medium">{String(r.log_date)}</span> — calls {String(r.calls_made)}, emails {String(r.emails_sent)}, LI {String(r.linkedin_touches)}, meetings {String(r.meetings_held)}, leads {String(r.leads_worked)}
            </li>
          ))}
        </ul>
      </div>

      <Link to="/reports" className="text-sm text-th-accent-600 hover:underline">
        ← Back to reports
      </Link>
    </div>
  );
}
