import {
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, Link as LinkIcon, Image as ImageIcon, Paperclip } from 'lucide-react';

export interface TicketRichReplyEditorRef {
  getHtml: () => string;
  getText: () => string;
  clear: () => void;
}

interface TicketRichReplyEditorProps {
  placeholder?: string;
  disabled?: boolean;
  variant?: 'default' | 'admin';
  onDraftChange?: (hasContent: boolean) => void;
  /** Upload an image to storage; returns signed URL for inline embed. */
  uploadImage?: (file: File) => Promise<string>;
  /** Add non-inline files (shown as links after send). */
  onAttachFiles?: (files: File[]) => void;
}

/** Rich reply for advisor tickets (default) or admin ticket management (admin tokens). */
export const TicketRichReplyEditor = forwardRef<TicketRichReplyEditorRef, TicketRichReplyEditorProps>(
  function TicketRichReplyEditor(
    {
      placeholder = 'Type your message…',
      disabled = false,
      variant = 'default',
      onDraftChange,
      uploadImage,
      onAttachFiles,
    },
    ref,
  ) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: false,
          codeBlock: false,
          code: false,
          horizontalRule: false,
          link: false,
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        }),
        Image.configure({
          inline: true,
          allowBase64: false,
        }),
        Placeholder.configure({ placeholder }),
      ],
      editable: !disabled,
      content: '',
      editorProps: {
        attributes: {
          class:
            variant === 'admin'
              ? 'min-h-[120px] px-3 py-2 text-sm text-th-text-primary focus:outline-none prose prose-sm max-w-none [&_.is-editor-empty:first-child::before]:text-th-text-tertiary'
              : 'min-h-[120px] px-3 py-2 text-sm text-neutral-900 focus:outline-none prose prose-sm max-w-none [&_.is-editor-empty:first-child::before]:text-neutral-400',
        },
        handlePaste: (_view, event) => {
          const items = event.clipboardData?.items;
          if (!items || !uploadImage) return false;
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (!file) continue;
              event.preventDefault();
              uploadImage(file)
                .then((url) => {
                  if (url) editor?.chain().focus().setImage({ src: url, alt: file.name || 'pasted image' }).run();
                })
                .catch(() => { /* parent may toast */ });
              return true;
            }
          }
          return false;
        },
        handleDrop: (_view, event) => {
          const files = event.dataTransfer?.files;
          if (!files?.length || !uploadImage) return false;
          const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
          if (!imageFiles.length) return false;
          event.preventDefault();
          for (const file of imageFiles) {
            uploadImage(file)
              .then((url) => {
                if (url) editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
              })
              .catch(() => { /* parent may toast */ });
          }
          return true;
        },
      },
      onUpdate: ({ editor: ed }) => {
        onDraftChange?.(!ed.isEmpty);
      },
    });

    useEffect(() => {
      if (editor) {
        editor.setEditable(!disabled);
      }
    }, [editor, disabled]);

    useEffect(() => {
      if (editor) {
        onDraftChange?.(!editor.isEmpty);
      }
    }, [editor, onDraftChange]);

    useImperativeHandle(
      ref,
      () => ({
        getHtml: () => editor?.getHTML() ?? '',
        getText: () => editor?.getText() ?? '',
        clear: () => {
          editor?.commands.clearContent();
          onDraftChange?.(false);
        },
      }),
      [editor, onDraftChange],
    );

    const setLink = useCallback(() => {
      if (!editor) return;
      const prev = editor.getAttributes('link').href as string | undefined;
      const url = window.prompt('Link URL', prev ?? 'https://');
      if (url === null) return;
      const trimmed = url.trim();
      if (trimmed === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
    }, [editor]);

    const onPickImage = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !uploadImage || !editor) return;
        if (!file.type.startsWith('image/')) return;
        try {
          const url = await uploadImage(file);
          if (url) editor.chain().focus().setImage({ src: url, alt: file.name }).run();
        } catch {
          // Parent may toast
        }
      },
      [editor, uploadImage],
    );

    const onPickFiles = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const list = e.target.files;
        e.target.value = '';
        if (!list?.length || !onAttachFiles) return;
        onAttachFiles(Array.from(list));
      },
      [onAttachFiles],
    );

    if (!editor) {
      return (
        <div
          className={`min-h-[120px] rounded-lg border animate-pulse ${
            variant === 'admin' ? 'border-th-border bg-th-bg-secondary' : 'border-neutral-200 bg-neutral-50'
          }`}
        />
      );
    }

    const bar = 'flex flex-wrap items-center gap-1 border-b px-2 py-1.5';
    const shell =
      variant === 'admin'
        ? 'rounded-lg border border-th-border bg-surface-primary focus-within:ring-2 focus-within:ring-primary-500/20'
        : 'rounded-lg border border-neutral-300 bg-white focus-within:ring-2 focus-within:ring-blue-500/20';

    const barBg = variant === 'admin' ? 'border-th-border-subtle bg-th-bg-secondary/80' : 'border-amber-200/80 bg-white/60';

    return (
      <div className={shell}>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-hidden
          onChange={onPickImage}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          aria-hidden
          onChange={onPickFiles}
        />
        <div className={`${bar} ${barBg}`}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-neutral-200' : 'hover:bg-neutral-100'}`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-neutral-200' : 'hover:bg-neutral-100'}`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded ${editor.isActive('bulletList') ? 'bg-neutral-200' : 'hover:bg-neutral-100'}`}
            title="Bullet list"
          >
            <List className="w-4 h-4" />
          </button>
          <button type="button" onClick={setLink} className="p-1.5 rounded hover:bg-neutral-100" title="Link">
            <LinkIcon className="w-4 h-4" />
          </button>
          {uploadImage && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => imageInputRef.current?.click()}
              className="p-1.5 rounded hover:bg-neutral-100 disabled:opacity-50"
              title="Insert image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          {onAttachFiles && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded hover:bg-neutral-100 disabled:opacity-50"
              title="Attach files"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          )}
        </div>
        <EditorContent editor={editor} />
      </div>
    );
  },
);
