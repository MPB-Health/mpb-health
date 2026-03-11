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
} from 'lucide-react';
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
      <div className="flex items-center justify-between px-4 py-3 bg-surface-primary border-b border-th-border">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold">Command Center</h1>
            <p className="text-sm text-th-text-secondary">
              {editMode ? 'Editing dashboard layout' : 'Your personalized dashboard'}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Last saved indicator */}
          {lastSaved && !editMode && (
            <span className="text-xs text-th-text-tertiary mr-2">
              Saved {formatTimeAgo(lastSaved)}
            </span>
          )}

          {/* Save success indicator */}
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs text-green-600 mr-2">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}

          {/* Edit mode actions */}
          {editMode && (
            <>
              <button
                onClick={() => setShowCatalog(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Widget
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
                title="Reset to default layout"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  'bg-th-accent-primary text-white hover:bg-th-accent-hover',
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

          {/* Keyboard shortcuts */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2 text-th-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
            title="Keyboard shortcuts"
          >
            <Keyboard className="h-5 w-5" />
          </button>

          {/* Edit mode toggle */}
          <button
            onClick={toggleEditMode}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              editMode
                ? 'bg-th-accent-primary text-white hover:bg-th-accent-hover'
                : 'bg-surface-tertiary text-th-text-primary hover:bg-surface-tertiary'
            )}
          >
            <Edit3 className="h-4 w-4" />
            {editMode ? 'Done Editing' : 'Edit Dashboard'}
          </button>
        </div>
      </div>

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
