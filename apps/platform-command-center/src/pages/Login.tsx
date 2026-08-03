import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { accounts, isAccountsConfigured } from '@/lib/accountsClient';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAccountsConfigured) {
      toast.error('Accounts client is not configured');
      return;
    }
    setBusy(true);
    try {
      await accounts.auth.signOut({ scope: 'local' });
      const { error } = await accounts.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      toast.success('Welcome');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="pcc-enter w-full max-w-md rounded-2xl border border-surface-line bg-surface-raised p-8 shadow-sm">
        <p className="font-display text-3xl text-ink">ARYX</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Platform Command Center</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Sign in with your ARYX Accounts credentials. This app talks only to the Accounts
          control plane — not product databases.
        </p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Email</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-surface-line bg-white px-3 py-2 outline-none ring-accent focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-surface-line bg-white px-3 py-2 outline-none ring-accent focus:ring-2"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
