import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { common, createLowlight } from 'lowlight';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
  Heading1, Heading2, Heading3,
  List, ListOrdered, ListTodo, Quote,
  Link as LinkIcon, Image as ImageIcon, Table as TableIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo, Redo, Code2, Palette, Highlighter,
  Plus, Minus, Trash2, ChevronDown,
  Upload, X, Loader2,
} from 'lucide-react';
import './RichTextEditor.css';
import { uploadEventImage, validateImageFile, type UploadResult } from './imageUploadService';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const createImageUploadExtension = (
  uploadFn: (file: File) => Promise<UploadResult>,
  onUploadStart?: () => void,
  onUploadEnd?: () => void
) => {
  return Extension.create({
    name: 'imageUpload',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('imageUpload'),
          props: {
            handleDrop(view, event, _slice, moved) {
              if (moved || !event.dataTransfer?.files.length) return false;
              const images = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
              if (images.length === 0) return false;
              event.preventDefault();
              onUploadStart?.();
              images.forEach(async (image) => {
                const validation = validateImageFile(image);
                if (!validation.valid) { onUploadEnd?.(); return; }
                const result = await uploadFn(image);
                onUploadEnd?.();
                if (result.success && result.url) {
                  const node = view.state.schema.nodes.image.create({ src: result.url });
                  const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
                  view.dispatch(view.state.tr.insert(coords?.pos ?? view.state.selection.head, node));
                }
              });
              return true;
            },
            handlePaste(view, event) {
              const images = Array.from(event.clipboardData?.items || []).filter(i => i.type.startsWith('image/'));
              if (images.length === 0) return false;
              event.preventDefault();
              onUploadStart?.();
              images.forEach(async (item) => {
                const file = item.getAsFile();
                if (!file) { onUploadEnd?.(); return; }
                const validation = validateImageFile(file);
                if (!validation.valid) { onUploadEnd?.(); return; }
                const result = await uploadFn(file);
                onUploadEnd?.();
                if (result.success && result.url) {
                  const node = view.state.schema.nodes.image.create({ src: result.url });
                  view.dispatch(view.state.tr.replaceSelectionWith(node));
                }
              });
              return true;
            },
          },
        }),
      ];
    },
  });
};

const ToolbarButton: React.FC<{
  onClick: () => void; isActive?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}> = ({ onClick, isActive, disabled, title, children }) => (
  <button
    type="button" onClick={onClick} disabled={disabled} title={title}
    className={`p-2 rounded-lg transition-all duration-200 ${
      isActive ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
  >{children}</button>
);

const ToolbarDivider: React.FC = () => <div className="w-px h-6 bg-neutral-300 mx-1" />;

const ColorPicker: React.FC<{ editor: Editor; type: 'text' | 'highlight' }> = ({ editor, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const colors = ['#000000','#374151','#6B7280','#9CA3AF','#EF4444','#F97316','#F59E0B','#EAB308','#22C55E','#14B8A6','#06B6D4','#3B82F6','#6366F1','#8B5CF6','#A855F7','#EC4899'];
  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen(!isOpen)} title={type === 'text' ? 'Text Color' : 'Highlight Color'}
        className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-200 flex items-center gap-1">
        {type === 'text' ? <Palette className="h-4 w-4" /> : <Highlighter className="h-4 w-4" />}
        <ChevronDown className="h-3 w-3" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 grid grid-cols-4 gap-1">
            {colors.map(color => (
              <button key={color} type="button" onClick={() => {
                if (type === 'text') {
                  editor.chain().focus().setColor(color).run();
                } else {
                  editor.chain().focus().toggleHighlight({ color }).run();
                }
                setIsOpen(false);
              }} className="w-6 h-6 rounded border border-neutral-300 hover:scale-110 transition-transform" style={{ backgroundColor: color }} title={color} />
            ))}
            <button type="button" onClick={() => {
              if (type === 'text') {
                editor.chain().focus().unsetColor().run();
              } else {
                editor.chain().focus().unsetHighlight().run();
              }
              setIsOpen(false);
            }} className="w-6 h-6 rounded border border-neutral-300 hover:bg-neutral-100 flex items-center justify-center text-xs" title="Remove color">x</button>
          </div>
        </>
      )}
    </div>
  );
};

const HeadingDropdown: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const headings = [
    { level: 1, label: 'Heading 1', icon: Heading1 },
    { level: 2, label: 'Heading 2', icon: Heading2 },
    { level: 3, label: 'Heading 3', icon: Heading3 },
  ] as const;
  const currentHeading = headings.find(h => editor.isActive('heading', { level: h.level }));

  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-between">
        <span className="text-sm font-medium">{currentHeading ? currentHeading.label : 'Paragraph'}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 py-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 min-w-[150px]">
            <button type="button" onClick={() => { editor.chain().focus().setParagraph().run(); setIsOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 ${!currentHeading ? 'bg-blue-50 text-blue-700' : ''}`}>Paragraph</button>
            {headings.map(({ level, label }) => (
              <button key={level} type="button" onClick={() => { editor.chain().focus().toggleHeading({ level }).run(); setIsOpen(false); }}
                className={`w-full px-3 py-2 text-left hover:bg-neutral-100 ${editor.isActive('heading', { level }) ? 'bg-blue-50 text-blue-700' : ''}`}
                style={{ fontSize: `${1.5 - level * 0.15}rem`, fontWeight: 600 }}>{label}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const TableMenu: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen(!isOpen)} title="Table"
        className={`p-2 rounded-lg transition-all duration-200 flex items-center gap-1 ${editor.isActive('table') ? 'bg-blue-100 text-blue-700' : 'text-neutral-600 hover:bg-neutral-100'}`}>
        <TableIcon className="h-4 w-4" /><ChevronDown className="h-3 w-3" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 py-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 min-w-[180px]">
            <button type="button" onClick={() => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setIsOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 flex items-center gap-2"><Plus className="h-4 w-4" />Insert Table (3x3)</button>
            {editor.isActive('table') && (
              <>
                <div className="h-px bg-neutral-200 my-1" />
                <button type="button" onClick={() => { editor.chain().focus().addColumnAfter().run(); setIsOpen(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100">Add Column After</button>
                <button type="button" onClick={() => { editor.chain().focus().addRowAfter().run(); setIsOpen(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100">Add Row After</button>
                <button type="button" onClick={() => { editor.chain().focus().deleteColumn().run(); setIsOpen(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 flex items-center gap-2"><Minus className="h-4 w-4" />Delete Column</button>
                <button type="button" onClick={() => { editor.chain().focus().deleteRow().run(); setIsOpen(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 flex items-center gap-2"><Minus className="h-4 w-4" />Delete Row</button>
                <div className="h-px bg-neutral-200 my-1" />
                <button type="button" onClick={() => { editor.chain().focus().deleteTable().run(); setIsOpen(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 className="h-4 w-4" />Delete Table</button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
  const [showSource, setShowSource] = useState(false);
  const [sourceContent, setSourceContent] = useState(content);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    const progressInterval = setInterval(() => { setUploadProgress(prev => Math.min(prev + 15, 90)); }, 150);
    try {
      const result = await uploadEventImage(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      if (!result.success) setUploadError(result.error || 'Upload failed');
      setTimeout(() => { setIsUploading(false); setUploadProgress(0); }, 500);
      return result;
    } catch (error) {
      clearInterval(progressInterval);
      const msg = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(msg);
      setIsUploading(false);
      return { success: false, error: msg };
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline hover:text-blue-800' } }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full h-auto rounded-lg' } }),
      Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
      CodeBlockLowlight.configure({ lowlight }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle, Color,
      Highlight.configure({ multicolor: true }),
      TaskList, TaskItem.configure({ nested: true }),
      createImageUploadExtension(handleImageUpload, () => setIsUploading(true), () => setIsUploading(false)),
    ],
    content,
    onUpdate: ({ editor }) => { const html = editor.getHTML(); onChange(html); setSourceContent(html); },
    editorProps: { attributes: { class: 'editor-content focus:outline-none min-h-[300px] p-4' } },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) { editor.commands.setContent(content); setSourceContent(content); }
  }, [content, editor]);

  const handleSourceChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => { setSourceContent(e.target.value); }, []);
  const applySourceChanges = useCallback(() => { if (editor) { editor.commands.setContent(sourceContent); onChange(sourceContent); } }, [editor, sourceContent, onChange]);

  const toggleSourceView = useCallback(() => {
    if (showSource) { applySourceChanges(); } else if (editor) { setSourceContent(editor.getHTML()); }
    setShowSource(!showSource);
  }, [showSource, applySourceChanges, editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', prev || 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => { setShowImageModal(true); setUploadError(null); }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { setUploadError(validation.error || 'Invalid file'); return; }
    const result = await handleImageUpload(file);
    if (result.success && result.url) { editor.chain().focus().setImage({ src: result.url }).run(); setShowImageModal(false); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [editor, handleImageUpload]);

  const handleUrlSubmit = useCallback((url: string) => {
    if (!editor || !url.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
    setShowImageModal(false);
  }, [editor]);

  if (!editor) {
    return (
      <div className="border border-neutral-300 rounded-lg p-4 bg-neutral-50 animate-pulse">
        <div className="h-4 bg-neutral-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-neutral-200 rounded mb-2"></div>
        <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <div className="rich-text-editor relative border border-neutral-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="toolbar flex flex-wrap items-center gap-1 p-2 bg-neutral-50 border-b border-neutral-200">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo className="h-4 w-4" /></ToolbarButton>
        <ToolbarDivider />
        <HeadingDropdown editor={editor} />
        <ToolbarDivider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold"><Bold className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic"><Italic className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline"><UnderlineIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough"><Strikethrough className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline Code"><Code className="h-4 w-4" /></ToolbarButton>
        <ColorPicker editor={editor} type="text" />
        <ColorPicker editor={editor} type="highlight" />
        <ToolbarDivider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List"><List className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List"><ListOrdered className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Task List"><ListTodo className="h-4 w-4" /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify"><AlignJustify className="h-4 w-4" /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton onClick={addLink} isActive={editor.isActive('link')} title="Insert Link"><LinkIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={addImage} title="Insert Image"><ImageIcon className="h-4 w-4" /></ToolbarButton>
        <TableMenu editor={editor} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote"><Quote className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block"><Code2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarDivider />
        <button type="button" onClick={toggleSourceView}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${showSource ? 'bg-blue-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
          title="Toggle HTML Source">{showSource ? 'Visual' : 'HTML'}</button>
      </div>

      {/* Upload overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-neutral-700">Uploading image...</span>
            <div className="w-32 bg-neutral-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {showSource ? (
        <div className="source-view">
          <textarea value={sourceContent} onChange={handleSourceChange}
            className="w-full min-h-[350px] p-4 font-mono text-sm bg-neutral-900 text-green-400 focus:outline-none resize-y"
            spellCheck={false} placeholder="<p>Enter HTML here...</p>" />
          <div className="flex justify-end p-2 bg-neutral-800 border-t border-neutral-700">
            <button type="button" onClick={applySourceChanges}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Apply HTML Changes</button>
          </div>
        </div>
      ) : (
        <EditorContent editor={editor} />
      )}

      {/* Image Upload Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">Insert Image</h3>
              <button type="button" onClick={() => setShowImageModal(false)} className="text-neutral-400 hover:text-neutral-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              {uploadError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{uploadError}</div>}
              <div onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-neutral-50 transition-all">
                {isUploading ? (
                  <div className="flex flex-col items-center"><Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" /><p className="text-sm font-medium text-blue-800">Uploading...</p></div>
                ) : (
                  <div className="flex flex-col items-center"><Upload className="h-10 w-10 text-neutral-400 mb-3" /><p className="text-sm font-medium text-neutral-700">Click to browse</p><p className="text-xs text-neutral-500 mt-1">PNG, JPG, WebP up to 5MB</p></div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileSelect} className="hidden" />
              <div className="flex items-center gap-3"><div className="flex-1 h-px bg-neutral-200" /><span className="text-xs text-neutral-500 uppercase">or</span><div className="flex-1 h-px bg-neutral-200" /></div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Image URL</label>
                <div className="flex gap-2">
                  <input type="url" placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUrlSubmit((e.target as HTMLInputElement).value); }} />
                  <button type="button" onClick={(e) => {
                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                    handleUrlSubmit(input.value);
                  }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">Insert</button>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t border-neutral-200">
              <button type="button" onClick={() => setShowImageModal(false)} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
