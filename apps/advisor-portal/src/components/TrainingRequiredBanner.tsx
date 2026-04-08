import { GraduationCap, Lock } from 'lucide-react';

export function TrainingRequiredBanner() {
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-800/40 p-5">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-amber-900 dark:text-amber-200">
            Complete Your Training to Unlock Full Access
          </h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300/80">
            Welcome to MPB Health! Before accessing the full advisor portal, please complete the
            training course below and pass the certification quiz with 80% or higher.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400/70">
            <Lock className="w-3.5 h-3.5" />
            <span>Other portal features will unlock after you complete the training</span>
          </div>
        </div>
      </div>
    </div>
  );
}
