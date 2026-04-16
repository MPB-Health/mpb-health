import { useState, useEffect } from 'react';
import { supabase } from '@mpbhealth/database';
import {
  Plus,
  Trash2,
  Pin,
  PinOff,
  Loader2,
  Search,
  StickyNote,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

const COLORS = [
  { key: 'default', bg: 'bg-white', border: 'border-slate-200' },
  { key: 'yellow', bg: 'bg-amber-50', border: 'border-amber-200' },
  { key: 'green', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { key: 'blue', bg: 'bg-sky-50', border: 'border-sky-200' },
  { key: 'pink', bg: 'bg-rose-50', border: 'border-rose-200' },
  { key: 'purple', bg: 'bg-violet-50', border: 'border-violet-200' },
];

function getColorClasses(key: string) {
  return COLORS.find((c) => c.key === key) || COLORS[0];
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState('default');

  const loadNotes = async () => {
    const { data } = await supabase
      .from('staff_notes')
      .select('id, title, content, color, pinned, created_at, updated_at')
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false });
    setNotes(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const createNote = async () => {
    const { data, error } = await supabase
      .from('staff_notes')
      .insert({ title: '', content: '', color: 'default' })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create note');
      return;
    }
    setNotes((prev) => [data, ...prev]);
    setEditingId(data.id);
    setEditTitle('');
    setEditContent('');
    setEditColor('default');
  };

  const saveNote = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from('staff_notes')
      .update({ title: editTitle, content: editContent, color: editColor, updated_at: new Date().toISOString() })
      .eq('id', editingId);

    if (error) {
      toast.error('Failed to save');
      return;
    }
    setNotes((prev) =>
      prev.map((n) =>
        n.id === editingId
          ? { ...n, title: editTitle, content: editContent, color: editColor, updated_at: new Date().toISOString() }
          : n,
      ),
    );
    setEditingId(null);
    toast.success('Note saved');
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('staff_notes').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingId === id) setEditingId(null);
    toast.success('Note deleted');
  };

  const togglePin = async (note: Note) => {
    const pinned = !note.pinned;
    await supabase.from('staff_notes').update({ pinned }).eq('id', note.id);
    setNotes((prev) =>
      prev
        .map((n) => (n.id === note.id ? { ...n, pinned } : n))
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }),
    );
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColor(note.color);
  };

  const filtered = notes.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notes</h1>
          <p className="text-slate-500 mt-1">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={createNote}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      {notes.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
      )}

      {/* Note editing modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => saveNote()}>
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-xl ${getColorClasses(editColor).bg} ${getColorClasses(editColor).border}`}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Note title..."
              autoFocus
              className="w-full text-lg font-semibold text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-400 mb-3"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Write your note..."
              rows={8}
              className="w-full text-sm text-slate-700 bg-transparent border-none outline-none resize-none placeholder:text-slate-400"
            />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/50">
              <div className="flex items-center gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setEditColor(c.key)}
                    className={`w-6 h-6 rounded-full border-2 ${c.bg} ${editColor === c.key ? 'border-blue-500 ring-2 ring-blue-500/20' : c.border}`}
                  />
                ))}
              </div>
              <button
                onClick={saveNote}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <StickyNote className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">{search ? 'No matching notes' : 'No notes yet. Create your first one!'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => {
            const cc = getColorClasses(note.color);
            return (
              <div
                key={note.id}
                onClick={() => startEditing(note)}
                className={`group relative rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all ${cc.bg} ${cc.border}`}
              >
                {note.pinned && (
                  <Pin className="absolute top-3 right-3 w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                )}
                {note.title && (
                  <h3 className="font-semibold text-slate-800 text-sm mb-1.5 truncate pr-6">{note.title}</h3>
                )}
                <p className="text-sm text-slate-600 line-clamp-4 whitespace-pre-wrap">
                  {note.content || 'Empty note'}
                </p>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200/50">
                  <span className="text-xs text-slate-400">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(note); }}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      title={note.pinned ? 'Unpin' : 'Pin'}
                    >
                      {note.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
