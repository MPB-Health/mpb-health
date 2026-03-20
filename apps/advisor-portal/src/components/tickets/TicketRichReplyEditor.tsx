import {
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, Link as LinkIcon } from 'lucide-react';

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
}

/** Rich reply for advisor tickets (default) or admin ticket management (admin tokens). */
export const TicketRichReplyEditor = forwardRef<TicketRichReplyEditorRef, TicketRichReplyEditorProps>(
  function TicketRichReplyEditor(
    { placeholder = 'Type your message…', disabled = false, variant = 'default', onDraftChange },
    ref,
  ) {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: false,
          codeBlock: false,
          code: false,
          horizontalRule: false,
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
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
        </div>
        <EditorContent editor={editor} />
      </div>
    );
  },
);
