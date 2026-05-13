import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2, Mail, Lock, User } from 'lucide-react';
import { supabase } from '@mpbhealth/database';
import { getBrandLogo } from '@mpbhealth/ui';

type InviteStatus = 'loading' | 'valid' | 'expired' | 'invalid' | 'accepted' | 'error';

interface InviteDetails {
  org_name: string;
  role: string;
  email: string;
  expires_at: string;
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<InviteStatus>('loading');
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [existingUser, setExistingUser] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Registration form state
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (token) {
      validateInvite();
    } else {
      setStatus('invalid');
    }
  }, [token]);

  const validateInvite = async () => {
    try {
      // Call edge function or RPC to validate token
      const { data, error } = await supabase.rpc('validate_org_invite', {
        invite_token: token,
      });

      if (error) {
        console.error('Validate invite error:', error);
        // If RPC doesn't exist, try direct query
        const { data: inviteData, error: queryError } = await supabase
          .from('org_invites')
          .select(`
            *,
            organization:organizations!org_id (name)
          `)
          .eq('token', token)
          .single();

        if (queryError || !inviteData) {
          setStatus('invalid');
          return;
        }

        // Check if expired
        if (new Date(inviteData.expires_at) < new Date()) {
          setStatus('expired');
          return;
        }

        // Check if already accepted
        if (inviteData.status === 'accepted') {
          setStatus('accepted');
          return;
        }

        setInvite({
          org_name: inviteData.organization?.name || 'MPB Health',
          role: inviteData.role,
          email: inviteData.email,
          expires_at: inviteData.expires_at,
        });

        // Check if user already exists
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email?.toLowerCase() === inviteData.email.toLowerCase()) {
          setExistingUser(true);
        }

        setStatus('valid');
        return;
      }

      if (data?.valid) {
        setInvite({
          org_name: data.org_name,
          role: data.role,
          email: data.email,
          expires_at: data.expires_at,
        });
        setExistingUser(data.user_exists);
        setStatus('valid');
      } else if (data?.expired) {
        setStatus('expired');
      } else if (data?.accepted) {
        setStatus('accepted');
      } else {
        setStatus('invalid');
      }
    } catch (err) {
      console.error('Validate invite error:', err);
      setStatus('error');
    }
  };

  const handleAcceptExisting = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('accept_org_invite', {
        invite_token: token,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to accept invitation');
      }

      toast.success('Welcome! You have joined the organization.');
      navigate('/');
    } catch (err) {
      console.error('Accept invite error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setProcessing(true);
    try {
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invite!.email,
        password: form.password,
        options: {
          data: {
            full_name: `${form.first_name} ${form.last_name}`,
            first_name: form.first_name,
            last_name: form.last_name,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      // Accept the invite
      const { data, error } = await supabase.rpc('accept_org_invite', {
        invite_token: token,
      });

      if (error) {
        console.error('Accept invite error:', error);
        // Continue anyway, user is created
      }

      toast.success('Account created! Please check your email to confirm.');
      navigate('/login');
    } catch (err) {
      console.error('Register error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setProcessing(false);
    }
  };

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    advisor: 'Advisor',
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Validating invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid/expired/accepted states
  if (status !== 'valid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          {status === 'expired' ? (
            <>
              <XCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Invitation Expired
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This invitation has expired. Please ask the person who invited you to send a new invitation.
              </p>
            </>
          ) : status === 'accepted' ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Already Accepted
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This invitation has already been accepted. You can log in to access your account.
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Invalid Invitation
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This invitation link is invalid or has been revoked.
              </p>
            </>
          )}
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Valid invitation
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src={getBrandLogo()}
            alt="MPB Health"
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            You're Invited!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Join <strong>{invite?.org_name}</strong> as a{' '}
            <strong>{roleLabels[invite?.role || ''] || invite?.role}</strong>
          </p>
        </div>

        {existingUser ? (
          // Existing user - just accept
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You already have an account with <strong>{invite?.email}</strong>. Click below to join the organization.
              </p>
            </div>
            <button
              onClick={handleAcceptExisting}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing && <Loader2 className="w-5 h-5 animate-spin" />}
              {processing ? 'Joining...' : 'Accept Invitation'}
            </button>
          </div>
        ) : (
          // New user - registration form
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <Mail className="w-4 h-4 inline mr-1" />
                Creating account for: <strong>{invite?.email}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="accept-first-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="accept-first-name"
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="accept-last-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  id="accept-last-name"
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your password"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing && <Loader2 className="w-5 h-5 animate-spin" />}
              {processing ? 'Creating Account...' : 'Create Account & Join'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
