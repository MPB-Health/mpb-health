import { AlertTriangle, X } from 'lucide-react';
import { useAdvisor } from '../contexts/AdvisorContext';
import { isAdvisorImpersonationSession, setAdvisorImpersonationFlag } from '../pages/AuthConfirm';

export function ImpersonationBanner() {
  const { profile } = useAdvisor();

  if (!isAdvisorImpersonationSession() || !profile) {
    return null;
  }

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email;

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2.5 text-sm flex items-center justify-center gap-3 relative z-50">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <p className="text-center">
        <strong>Support session:</strong> you are viewing the advisor portal as{' '}
        <span className="font-semibold">{name}</span>. Sign out when debugging is complete.
      </p>
      <button
        type="button"
        onClick={() => setAdvisorImpersonationFlag(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-amber-600/20"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
