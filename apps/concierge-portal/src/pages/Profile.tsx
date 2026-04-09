import { useState, useEffect } from 'react';
import { supabase } from '@mpbhealth/database';
import { User, Mail, Clock, Loader2 } from 'lucide-react';

interface UserProfile {
  email: string;
  lastSignIn: string | null;
  createdAt: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setProfile({
          email: session.user.email ?? '',
          lastSignIn: session.user.last_sign_in_at ?? null,
          createdAt: session.user.created_at,
        });
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center text-slate-600 py-16">Unable to load profile</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        <div className="flex items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{profile.email}</p>
            <p className="text-sm text-slate-500">Concierge Staff</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-medium text-slate-800">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Last sign in</p>
              <p className="text-sm font-medium text-slate-800">
                {profile.lastSignIn
                  ? new Date(profile.lastSignIn).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Account created</p>
              <p className="text-sm font-medium text-slate-800">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
