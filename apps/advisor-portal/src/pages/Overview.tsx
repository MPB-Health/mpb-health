import { Compass } from 'lucide-react';

export default function Overview() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-th-accent-100 dark:bg-th-accent-900/30">
          <Compass className="w-6 h-6 text-th-accent-600 dark:text-th-accent-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Overview</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            A quick tour of everything available in the advisor portal
          </p>
        </div>
      </div>
    </div>
  );
}
