// ============================================================================
// Dashboard Toolbar Component
// Edit mode controls, actions, and status
// ============================================================================

import { useState } from 'react';
import {
  Edit3,
  Save,
  RotateCcw,
  Plus,
  Keyboard,
  Check,
  Loader2,
  LayoutDashboard,
} from 'lucide-react';
import { GradientHeader } from '@mpbhealth/ui';
import { useDashboardStore } from '../../contexts/DashboardContext';
import { useOrg } from '../../contexts/OrgContext';
import { WidgetCatalog } from './WidgetCatalog';
import { KeyboardShortcutsHelp } from './KeyboardShortcuts';
const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Dashboard Toolbar Component
// ============================================================================

export function DashboardToolbar() {
  const { activeOrgId } = useOrg();
  const {
    editMode,
    toggleEditMode,
    saveLayout,
    resetLayout,
    isSaving,
    lastSaved,
  } = useDashboardStore();

  const [showCatalog, setShowCatalog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    if (!activeOrgId) return;
    const success = await saveLayout(activeOrgId);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleReset = async () => {
    if (!activeOrgId) return;
    if (window.confirm('Reset dashboard to default layout? This cannot be undone.')) {
      await resetLayout(activeOrgId);
    }
  };

  return (
    <>
      <GradientHeader
        title="Command Center"
        subtitle={editMode ? 'Editing dashboard layout' : 'Your personalized workspace — real-time insights at a glance'}
        icon={<LayoutDashboard className="w-5 h-5" />}
        size="md"
        actions={
          <div className="flex items-center gap-2">
            {lastSaved && !editMode && (
              <span className="text-xs text-th-text-tertiary mr-1">
                Saved {formatTimeAgo(lastSaved)}
              </span>
            )}

            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-green-600 mr-1">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}

            {editMode && (
              <>
                <button
                  onClick={() => setShowCatalog(true)}
                  className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-th-accent-600 hover:bg-th-accent-50 dark:hover:bg-th-accent-900/20 rounded-xl border border-th-accent-200 dark:border-th-accent-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Widget
                </button>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-tertiary rounded-xl border border-th-border transition-colors"
                  title="Reset to default layout"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors shadow-sm',
                    'bg-th-accent-600 text-white hover:bg-th-accent-700',
                    isSaving && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </button>
              </>
            )}

            <button
              onClick={() => setShowShortcuts(true)}
              className="p-2 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-tertiary rounded-xl transition-colors"
              title="Keyboard shortcuts"
            >
              <Keyboard className="h-4.5 w-4.5" />
            </button>

            <button
              onClick={toggleEditMode}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all',
                editMode
                  ? 'bg-th-accent-600 text-white hover:bg-th-accent-700 shadow-sm'
                  : 'bg-surface-tertiary text-th-text-primary hover:bg-surface-secondary border border-th-border'
              )}
            >
              <Edit3 className="h-4 w-4" />
              {editMode ? 'Done' : 'Customize'}
            </button>
          </div>
        }
      />

      {/* Widget Catalog Modal */}
      <WidgetCatalog
        isOpen={showCatalog}
        onClose={() => setShowCatalog(false)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsHelp
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

export default DashboardToolbar;
