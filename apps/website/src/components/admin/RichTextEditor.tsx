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
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Code2,
  Palette,
  Highlighter,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  Upload,
  X,
  Loader2,
} from 'lucide-react';
import './RichTextEditor.css';
import {
  uploadBlogImage,
  validateImageFile,
  type UploadResult,
} from '../../lib/imageUploadService';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

// Create ImageUpload Extension for drag-drop and paste support
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
              if (moved || !event.dataTransfer?.files.length) {
                return false;
              }

              const files = Array.from(event.dataTransfer.files);
              const images = files.filter((file) =>
                file.type.startsWith('image/')
              );

              if (images.length === 0) return false;

              event.preventDefault();
              onUploadStart?.();

              images.forEach(async (image) => {
                const validation = validateImageFile(image);
                if (!validation.valid) {
                  console.warn('Invalid image:', validation.error);
                  onUploadEnd?.();
                  return;
                }

                const result = await uploadFn(image);
                onUploadEnd?.();

                if (result.success && result.url) {
                  const { schema } = view.state;
                  const coordinates = view.posAtCoords({
                    left: event.clientX,
                    top: event.clientY,
                  });

                  const node = schema.nodes.image.create({
                    src: result.url,
                  });

                  const transaction = view.state.tr.insert(
                    coordinates?.pos ?? view.state.selection.head,
                    node
                  );
                  view.dispatch(transaction);
                }
              });

              return true;
            },

            handlePaste(view, event) {
              const items = Array.from(event.clipboardData?.items || []);
              const images = items.filter((item) =>
                item.type.startsWith('image/')
              );

              if (images.length === 0) return false;

              event.preventDefault();
              onUploadStart?.();

              images.forEach(async (item) => {
                const file = item.getAsFile();
                if (!file) {
                  onUploadEnd?.();
                  return;
                }

                const validation = validateImageFile(file);
                if (!validation.valid) {
                  console.warn('Invalid image:', validation.error);
                  onUploadEnd?.();
                  return;
                }

                const result = await uploadFn(file);
                onUploadEnd?.();

                if (result.success && result.url) {
                  const { schema } = view.state;
                  const node = schema.nodes.image.create({
                    src: result.url,
                  });

                  const transaction = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(transaction);
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

// Toolbar Button Component
const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, isActive, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-blue-100 text-blue-700 shadow-sm'
        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    {children}
  </button>
);

// Toolbar Divider
const ToolbarDivider: React.FC = () => (
  <div className="w-px h-6 bg-neutral-300 mx-1" />
);

// Color Picker Dropdown
const ColorPicker: React.FC<{
  editor: Editor;
  type: 'text' | 'highlight';
}> = ({ editor, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const colors = [
    '#000000', '#374151', '#6B7280', '#9CA3AF',
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
    '#6366F1', '#8B5CF6', '#A855F7', '#EC4899',
  ];

  const handleColorSelect = (color: string) => {
    if (type === 'text') {
      editor.chain().focus().setColor(color).run();
    } else {
      editor.chain().focus().toggleHighlight({ color }).run();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={type === 'text' ? 'Text Color' : 'Highlight Color'}
        className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-200 flex items-center gap-1"
      >
        {type === 'text' ? <Palette className="h-4 w-4" /> : <Highlighter className="h-4 w-4" />}
        <ChevronDown className="h-3 w-3" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 grid grid-cols-4 gap-1">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorSelect(color)}
                className="w-6 h-6 rounded border border-neutral-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                if (type === 'text') {
                  editor.chain().focus().unsetColor().run();
                } else {
                  editor.chain().focus().unsetHighlight().run();
                }
                setIsOpen(false);
              }}
              className="w-6 h-6 rounded border border-neutral-300 hover:bg-neutral-100 flex items-center justify-center text-xs"
              title="Remove color"
            >
              ✕
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Heading Dropdown
const HeadingDropdown: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);

  const headings = [
    { level: 1, label: 'Heading 1', icon: Heading1 },
    { level: 2, label: 'Heading 2', icon: Heading2 },
    { level: 3, label: 'Heading 3', icon: Heading3 },
    { level: 4, label: 'Heading 4', icon: null },
    { level: 5, label: 'Heading 5', icon: null },
    { level: 6, label: 'Heading 6', icon: null },
  ] as const;

  const currentHeading = headings.find((h) =>
    editor.isActive('heading', { level: h.level })
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-between"
      >
        <span className="text-sm font-medium">
          {currentHeading ? currentHeading.label : 'Paragraph'}
        </span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 py-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 min-w-[150px]">
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().setParagraph().run();
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 ${
                !currentHeading ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              Paragraph
            </button>
            {headings.map(({ level, label }) => (
              <button
                key={level}
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level }).run();
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left hover:bg-neutral-100 ${
                  editor.isActive('heading', { level }) ? 'bg-blue-50 text-blue-700' : ''
                }`}
                style={{ fontSize: `${1.5 - level * 0.1}rem`, fontWeight: 600 }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Table Menu
const TableMenu: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Table"
        className={`p-2 rounded-lg transition-all duration-200 flex items-center gap-1 ${
          editor.isActive('table')
            ? 'bg-blue-100 text-blue-700'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
        }`}
      >
        <TableIcon className="h-4 w-4" />
        <ChevronDown className="h-3 w-3" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 py-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 min-w-[180px]">
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Insert Table (3x3)
            </button>
            {editor.isActive('table') && (
              <>
                <div className="h-px bg-neutral-200 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().addColumnAfter().run();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100"
                >
                  Add Column After
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().addRowAfter().run();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100"
                >
                  Add Row After
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().deleteColumn().run();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 flex items-center gap-2"
                >
                  <Minus className="h-4 w-4" />
                  Delete Column
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().deleteRow().run();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 flex items-center gap-2"
                >
                  <Minus className="h-4 w-4" />
                  Delete Row
                </button>
                <div className="h-px bg-neutral-200 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().deleteTable().run();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Table
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Image Upload Modal Component
const ImageUploadModal: React.FC<{
  onClose: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlSubmit: (url: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}> = ({ onClose, onFileSelect, onUrlSubmit, fileInputRef, isUploading, uploadProgress, error }) => {
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((f) => f.type.startsWith('image/'));
    
    if (imageFile && fileInputRef.current) {
      // Create a new FileList-like object
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(imageFile);
      fileInputRef.current.files = dataTransfer.files;
      
      // Trigger the change event
      const event = new Event('change', { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
      onFileSelect({ target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">Insert Image</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Upload Zone */}
          {isUploading ? (
            <div className="border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 p-8">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
                <p className="text-sm font-medium text-blue-800">Uploading...</p>
                <div className="w-full max-w-xs mt-3 bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-blue-600 mt-1">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <div
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                ${isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-neutral-300 hover:border-blue-400 hover:bg-neutral-50'
                }
              `}
            >
              <div className="flex flex-col items-center">
                <Upload className="h-10 w-10 text-neutral-400 mb-3" />
                <p className="text-sm font-medium text-neutral-700">
                  {isDragging ? 'Drop image here' : 'Drop image or click to browse'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  PNG, JPG, WebP up to 5MB
                </p>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onFileSelect}
            className="hidden"
          />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-500 uppercase">or</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => onUrlSubmit(urlInput)}
                disabled={!urlInput.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Insert
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Editor Component
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
}) => {
  const [showSource, setShowSource] = useState(false);
  const [sourceContent, setSourceContent] = useState(content);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload handler for drag-drop and toolbar
  const handleImageUpload = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 15, 90));
    }, 150);

    try {
      const result = await uploadBlogImage(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!result.success) {
        setUploadError(result.error || 'Upload failed');
      }

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

      return result;
    } catch (error) {
      clearInterval(progressInterval);
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMsg);
      setIsUploading(false);
      return { success: false, error: errorMsg };
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      // Add image upload extension for drag-drop and paste
      createImageUploadExtension(
        handleImageUpload,
        () => setIsUploading(true),
        () => setIsUploading(false)
      ),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setSourceContent(html);
    },
    editorProps: {
      attributes: {
        class: 'editor-content focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  // Sync editor content when prop changes externally (e.g., when editing a different article)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      setSourceContent(content);
    }
  }, [content, editor]);

  const handleSourceChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSourceContent(e.target.value);
    },
    []
  );

  const applySourceChanges = useCallback(() => {
    if (editor) {
      editor.commands.setContent(sourceContent);
      onChange(sourceContent);
    }
  }, [editor, sourceContent, onChange]);

  const toggleSourceView = useCallback(() => {
    if (showSource) {
      // Switching from source to visual - apply changes
      applySourceChanges();
    } else {
      // Switching to source view - update source content
      if (editor) {
        setSourceContent(editor.getHTML());
      }
    }
    setShowSource(!showSource);
  }, [showSource, applySourceChanges, editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  // Open image upload modal
  const addImage = useCallback(() => {
    setShowImageModal(true);
    setUploadError(null);
  }, []);

  // Handle file selection from modal
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    const result = await handleImageUpload(file);
    if (result.success && result.url) {
      editor.chain().focus().setImage({ src: result.url }).run();
      setShowImageModal(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [editor, handleImageUpload]);

  // Handle URL submission from modal
  const handleUrlSubmit = useCallback((url: string) => {
    if (!editor || !url.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
    setShowImageModal(false);
  }, [editor]);

  if (!editor) {
    return (
      <div className="border border-neutral-300 rounded-lg p-4 bg-neutral-50">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-neutral-200 rounded"></div>
              <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rich-text-editor relative border border-neutral-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="toolbar flex flex-wrap items-center gap-1 p-2 bg-neutral-50 border-b border-neutral-200">
        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Headings Dropdown */}
        <HeadingDropdown editor={editor} />

        <ToolbarDivider />

        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        {/* Colors */}
        <ColorPicker editor={editor} type="text" />
        <ColorPicker editor={editor} type="highlight" />

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
          title="Task List"
        >
          <ListTodo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Text Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Insert Elements */}
        <ToolbarButton
          onClick={addLink}
          isActive={editor.isActive('link')}
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="Insert Image">
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <TableMenu editor={editor} />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Source View Toggle */}
        <button
          type="button"
          onClick={toggleSourceView}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            showSource
              ? 'bg-blue-600 text-white'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }`}
          title="Toggle HTML Source"
        >
          {showSource ? 'Visual' : 'HTML'}
        </button>
      </div>

      {/* Upload Indicator */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-neutral-700">Uploading image...</span>
            <div className="w-32 bg-neutral-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Editor Content or Source View */}
      {showSource ? (
        <div className="source-view">
          <textarea
            value={sourceContent}
            onChange={handleSourceChange}
            className="w-full min-h-[350px] p-4 font-mono text-sm bg-neutral-900 text-green-400 focus:outline-none resize-y"
            spellCheck={false}
            placeholder="<p>Enter HTML here...</p>"
          />
          <div className="flex justify-end p-2 bg-neutral-800 border-t border-neutral-700">
            <button
              type="button"
              onClick={applySourceChanges}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply HTML Changes
            </button>
          </div>
        </div>
      ) : (
        <EditorContent editor={editor} />
      )}

      {/* Image Upload Modal */}
      {showImageModal && (
        <ImageUploadModal
          onClose={() => setShowImageModal(false)}
          onFileSelect={handleFileSelect}
          onUrlSubmit={handleUrlSubmit}
          fileInputRef={fileInputRef}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          error={uploadError}
        />
      )}
    </div>
  );
};

export default RichTextEditor;

