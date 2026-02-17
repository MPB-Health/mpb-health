// ============================================================================
// Dashboard Container Component
// Main container for the Championship Command Center
// ============================================================================

import { useEffect } from 'react';
import { Loader2, AlertCircle, LayoutDashboard } from 'lucide-react';
import { createClientLogger } from '@mpbhealth/utils';
import { DashboardProvider, useDashboardStore } from '../../contexts/DashboardContext';
import { DashboardToolbar } from './DashboardToolbar';
import { WidgetGrid } from './WidgetGrid';
import { useKeyboardShortcuts } from './KeyboardShortcuts';

const log = createClientLogger('DashboardContainer');
const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Dashboard Container (with Provider)
// ============================================================================

export function DashboardContainer() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}

// ============================================================================
// Dashboard Content (uses context)
// ============================================================================

function DashboardContent() {
  const { isLoading, error, widgets, editMode, clearError } = useDashboardStore();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      // Trigger widget refresh by dispatching a custom event
      // Individual widgets listen for this
      log.info('Dashboard refresh triggered');
    };

    window.addEventListener('dashboard:refresh', handleRefresh);
    return () => window.removeEventListener('dashboard:refresh', handleRefresh);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-center max-w-md">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
            Failed to load dashboard
          </h3>
          <p className="text-sm text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={clearError}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (widgets.length === 0) {
    return (
      <div className="flex flex-col">
        <DashboardToolbar />
        <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
          <LayoutDashboard className="h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No widgets yet</h3>
          <p className="text-sm text-center max-w-md mb-4">
            Your dashboard is empty. Click "Edit Dashboard" and then "Add Widget" to customize your command center.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col min-h-screen',
        editMode && 'bg-violet-50/50 dark:bg-violet-950/20'
      )}
    >
      {/* Toolbar */}
      <DashboardToolbar />

      {/* Edit mode indicator */}
      {editMode && (
        <div className="bg-violet-100 dark:bg-violet-900/30 px-4 py-2 text-sm text-violet-700 dark:text-violet-300 border-b border-violet-200 dark:border-violet-800">
          <span className="font-medium">Edit Mode:</span> Drag widgets to reorder, resize using the controls, or remove widgets you don't need.
        </div>
      )}

      {/* Widget Grid */}
      <div className="flex-1">
        <WidgetGrid />
      </div>
    </div>
  );
}

export default DashboardContainer;
