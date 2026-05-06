import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GradientHeader } from '@mpbhealth/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { supabase } from '../lib/supabase';

type Channel = 'email' | 'phone_script' | 'sms';

export default function MessageTemplatesPage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrg();
  const qc = useQueryClient();
  const [channel, setChannel] = useState<Channel>('email');
  const [name, setName] = useState('');
  const [body, setBody] = useState('');

  const { data: templates = [] } = useQuery({
    queryKey: ['crmRepTemplates', activeOrgId, user?.id, channel],
    queryFn: async () => {
      if (!activeOrgId || !user?.id) return [];
      const { data, error } = await supabase
        .from('crm_rep_message_templates')
        .select('*')
        .eq('org_id', activeOrgId)
        .eq('user_id', user.id)
        .eq('channel', channel)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeOrgId && !!user?.id,
  });

  const save = async () => {
    if (!activeOrgId || !user?.id || !name.trim()) {
      toast.error('Name required');
      return;
    }
    const { error } = await supabase.from('crm_rep_message_templates').insert({
      org_id: activeOrgId,
      user_id: user.id,
      channel,
      name: name.trim(),
      body: body.trim() || ' ',
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setName('');
    setBody('');
    toast.success('Template saved');
    qc.invalidateQueries({ queryKey: ['crmRepTemplates', activeOrgId, user.id, channel] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('crm_rep_message_templates').delete().eq('id', id);
    if (!error) {
      qc.invalidateQueries({ queryKey: ['crmRepTemplates', activeOrgId, user?.id, channel] });
    }
  };

  return (
    <div className="space-y-6">
      <GradientHeader
        title="My templates"
        subtitle="Personal email, phone script, and SMS snippets for cadences and one-off sends."
      />
      <div className="flex gap-2">
        {(['email', 'phone_script', 'sms'] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChannel(c)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${channel === c ? 'border-th-accent-500 bg-th-accent-50' : 'border-th-border'}`}
          >
            {c === 'phone_script' ? 'Phone' : c}
          </button>
        ))}
      </div>
      <div className="bg-surface-primary rounded-2xl border border-th-border p-6 max-w-3xl space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name"
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Body / script" className="w-full border rounded-lg px-3 py-2 text-sm" />
        <button type="button" onClick={save} className="px-4 py-2 rounded-xl bg-th-accent-600 text-white text-sm">
          Add template
        </button>
      </div>
      <ul className="space-y-2 text-sm">
        {templates.map((t: { id: string; name: string; body: string }) => (
          <li key={t.id} className="bg-surface-primary border border-th-border rounded-xl p-4 flex justify-between gap-4">
            <div>
              <p className="font-medium text-th-text-primary">{t.name}</p>
              <p className="text-th-text-secondary mt-1 whitespace-pre-wrap line-clamp-4">{t.body}</p>
            </div>
            <button type="button" onClick={() => remove(t.id)} className="text-red-600 text-xs shrink-0">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
