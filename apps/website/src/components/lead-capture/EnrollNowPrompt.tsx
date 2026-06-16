import { ArrowRight } from 'lucide-react';
import {
  getPlanEnrollLabel,
  getPlanEnrollUrl,
  PLAN_ENROLL_OPTIONS,
} from '../../lib/planEnrollUrls';
import { getPlanEnrollmentConfig } from '../../lib/planEnrollmentConfig';

interface EnrollNowPromptProps {
  /** When set (and not "unsure"), highlights that plan with a primary CTA. */
  preferredPlanId?: string;
  className?: string;
}

export function EnrollNowPrompt({ preferredPlanId, className = '' }: EnrollNowPromptProps) {
  const hasPreferred =
    preferredPlanId &&
    preferredPlanId !== 'unsure' &&
    !!getPlanEnrollmentConfig(preferredPlanId);

  const otherPlans = hasPreferred
    ? PLAN_ENROLL_OPTIONS.filter((p) => p.id !== preferredPlanId)
    : PLAN_ENROLL_OPTIONS;

  return (
    <div className={`rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50/50 p-6 ${className}`}>
      <h4 className="font-semibold text-neutral-900 mb-1">Ready to enroll now?</h4>
      <p className="text-sm text-neutral-600 mb-4">
        {hasPreferred
          ? 'Start enrollment for your preferred membership, or explore other options below.'
          : 'Choose the membership that fits you best and start enrollment online.'}
      </p>

      {hasPreferred && (
        <a
          href={getPlanEnrollUrl(preferredPlanId!)}
          className="mb-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
        >
          Enroll Now — {getPlanEnrollLabel(preferredPlanId!)}
          <ArrowRight className="h-4 w-4" />
        </a>
      )}

      {hasPreferred && otherPlans.length > 0 && (
        <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">
          Other memberships
        </p>
      )}

      <div className={`grid gap-2 ${hasPreferred ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {(hasPreferred ? otherPlans : PLAN_ENROLL_OPTIONS).map((plan) => (
          <a
            key={plan.id}
            href={getPlanEnrollUrl(plan.id)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-blue-200 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            {plan.label}
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
