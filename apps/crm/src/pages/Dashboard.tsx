// ============================================================================
// Dashboard Page - Championship Command Center
// Fully customizable drag-and-drop widget dashboard
// ============================================================================

import { Suspense } from 'react';
import DashboardContainer from '../components/dashboard/DashboardContainer';

// ============================================================================
// Loading Fallback
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>

      {/* Widget grid skeleton */}
      <div className="grid grid-cols-12 gap-4">
        {/* Row 1: 4 small metrics */}
        {[...Array(4)].map((_, i) => (
          <div key={`sm-${i}`} className="col-span-3 h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}

        {/* Row 2: 2 medium widgets */}
        {[...Array(2)].map((_, i) => (
          <div key={`md-${i}`} className="col-span-6 h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}

        {/* Row 3: 2 medium widgets */}
        {[...Array(2)].map((_, i) => (
          <div key={`md2-${i}`} className="col-span-6 h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Dashboard Page Component
// ============================================================================

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContainer />
    </Suspense>
  );
}
