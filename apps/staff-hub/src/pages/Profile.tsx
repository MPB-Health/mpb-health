import { useState, useEffect } from 'react';
import { supabase } from '@mpbhealth/database';
import { usePortalAccess } from '@mpbhealth/auth';
import { Save, Loader2, User, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  title: string;
  timezone: string;
  avatar_url: string;
  role: string;
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
];

export default function Profile() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const { roles } = usePortalAccess(userId ?? undefined);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      setUserId(session.user.id);

      const { data } = await supabase
        .from('admin_users')
        .select('first_name, last_name, email, phone, department, title, timezone, avatar_url, role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          email: data.email ?? session.user.email ?? '',
          phone: data.phone ?? '',
          department: data.department ?? '',
          title: data.title ?? '',
          timezone: data.timezone ?? 'America/New_York',
          avatar_url: data.avatar_url ?? '',
          role: data.role ?? '',
        });
      } else {
        setProfile({
          first_name: '',
          last_name: '',
          email: session.user.email ?? '',
          phone: '',
          department: '',
          title: '',
          timezone: 'America/New_York',
          avatar_url: '',
          role: '',
        });
      }
      setLoading(false);
    });
  }, []);

  const update = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => prev ? { ...prev, [field]: value } : prev);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!userId || !profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_users')
        .upsert({
          id: userId,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone: profile.phone,
          department: profile.department,
          title: profile.title,
          timezone: profile.timezone,
        }, { onConflict: 'id' });

      if (error) throw error;
      setDirty(false);
      toast.success('Profile saved');
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500 mt-1">Manage your account information</p>
      </div>

      {/* Avatar + name header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
            {profile.first_name?.[0]?.toUpperCase() || profile.email[0]?.toUpperCase() || <User className="w-7 h-7" />}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : profile.email}
            </h2>
            <p className="text-sm text-slate-500">{profile.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
            <input
              type="text"
              value={profile.first_name}
              onChange={(e) => update('first_name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
            <input
              type="text"
              value={profile.last_name}
              onChange={(e) => update('last_name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <input
              type="text"
              value={profile.department}
              onChange={(e) => update('department', e.target.value)}
              placeholder="e.g. Sales, Support, Engineering"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
            <input
              type="text"
              value={profile.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Account Manager"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
            <select
              value={profile.timezone}
              onChange={(e) => update('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace('_', ' ').replace('America/', '')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <span key={role} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                <Shield className="w-3 h-3" />
                {role.replace('_', ' ')}
              </span>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
