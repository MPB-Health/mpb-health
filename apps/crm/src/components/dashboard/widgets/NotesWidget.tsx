// ============================================================================
// Notes Widget
// Quick notes with rich text support
// ============================================================================

import { useState, useEffect } from 'react';
import { Plus, Pin, Trash2, StickyNote } from 'lucide-react';
import { useOrg } from '../../../contexts/OrgContext';
import { supabase } from '../../../lib/supabase';
import { createDashboardNotesService, type DashboardNote } from '@mpbhealth/crm-core/dashboard';
import type { BaseWidgetProps } from '../types';
import { sanitizeHtml } from '@mpbhealth/utils';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Notes Widget Component
// ============================================================================

const notesService = createDashboardNotesService(supabase);

export default function NotesWidget({ config, size }: BaseWidgetProps) {
  const { activeOrgId } = useOrg();
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const showPinnedOnly = config.showPinnedOnly === true;
  const maxNotes = (config.maxNotes as number) || 5;

  useEffect(() => {
    if (activeOrgId) {
      loadNotes();
    }
  }, [activeOrgId, showPinnedOnly]);

  const loadNotes = async () => {
    if (!activeOrgId) return;
    const data = await notesService.getNotes(activeOrgId, {
      pinnedOnly: showPinnedOnly,
      limit: maxNotes,
    });
    setNotes(data);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !activeOrgId) return;
    const result = await notesService.createNote(activeOrgId, { content: newNote });
    if (result.success) {
      setNewNote('');
      setIsAdding(false);
      loadNotes();
    }
  };

  const handleTogglePin = async (noteId: string) => {
    await notesService.togglePin(noteId);
    loadNotes();
  };

  const handleDelete = async (noteId: string) => {
    await notesService.deleteNote(noteId);
    loadNotes();
  };

  return (
    <div className="p-4">
      {/* Add Note */}
      {isAdding ? (
        <div className="mb-4">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write a note..."
            className="w-full p-2 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            rows={3}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => { setIsAdding(false); setNewNote(''); }}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 w-full p-2 mb-4 text-sm text-gray-500 border-2 border-dashed rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add a note
        </button>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No notes yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onTogglePin={() => handleTogglePin(note.id)}
              onDelete={() => handleDelete(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Note Card Component
// ============================================================================

interface NoteCardProps {
  note: DashboardNote;
  onTogglePin: () => void;
  onDelete: () => void;
}

const NOTE_COLORS: Record<string, string> = {
  default: 'bg-gray-50 dark:bg-gray-700/50',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
  green: 'bg-green-50 dark:bg-green-900/20',
  blue: 'bg-blue-50 dark:bg-blue-900/20',
  blue: 'bg-blue-50 dark:bg-blue-900/20',
  red: 'bg-red-50 dark:bg-red-900/20',
  orange: 'bg-orange-50 dark:bg-orange-900/20',
};

function NoteCard({ note, onTogglePin, onDelete }: NoteCardProps) {
  return (
    <div className={cn('p-3 rounded-lg group', NOTE_COLORS[note.color] || NOTE_COLORS.default)}>
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex-1 text-sm prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) }}
        />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onTogglePin}
            className={cn(
              'p-1 rounded hover:bg-white/50 transition-colors',
              note.is_pinned && 'text-amber-500'
            )}
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-white/50 text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {new Date(note.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
