import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseUrl } from '@mpbhealth/database';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/advisor-forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          redirect_base: window.location.origin,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#A8B8AC]/15 via-white to-[#A8B8AC]/10 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#8B9B3A]/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[#5B6B2E]" />
          </div>
          <h1 className="text-2xl font-bold text-[#2F3E2F]">Check your email</h1>
          <p className="text-slate-600">
            If an account exists for <strong>{email}</strong>, we've sent a password reset link.
            Check your inbox (and spam folder).
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#4A7C8A] hover:text-[#3D6773]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#A8B8AC]/15 via-white to-[#A8B8AC]/10 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-[#2F3E2F] to-[#4A7C8A] flex items-center justify-center mb-4">
            <span className="text-white font-bold text-lg">MPB</span>
          </div>
          <h1 className="text-2xl font-bold text-[#2F3E2F]">Reset your password</h1>
          <p className="mt-2 text-slate-600">Enter your email and we'll send you a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="concierge@mympb.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-2.5 px-4 rounded-lg bg-[#4A7C8A] text-white font-medium text-sm hover:bg-[#3D6773] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
