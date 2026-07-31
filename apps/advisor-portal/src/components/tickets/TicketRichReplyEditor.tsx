import {
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from 'react';
import type { ChangeEvent } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, Link as LinkIcon, Image as ImageIcon, Paperclip } from 'lucide-react';
import {
  filesFromClipboardEvent,
  stripEphemeralInlineMedia,
  withPastedFileName,
} from '../../utils/clipboardFiles';
import { PendingAttachmentPreviews } from './PendingAttachmentPreviews';

export interface TicketRichReplyEditorRef {
  getHtml: () => string;
  getText: () => string;
  clear: () => void;
  /** Move caret into the editor (e.g. after a successful send). */
  focusComposer: () => void;
}

interface TicketRichReplyEditorProps {
  placeholder?: string;
  disabled?: boolean;
  variant?: 'default' | 'admin';
  onDraftChange?: (hasContent: boolean) => void;
  /** Upload an image for inline embed. */
  uploadImage?: (file: File) => Promise<string>;
  onAttachFiles?: (files: File[]) => void;
  /** Queued attachments — filmstrip under the editor (ITSTS TicketEditor parity). */
  pendingFiles?: File[];
  onRemovePendingFile?: (index: number) => void;
  /** After a failed send, parent restores HTML once TipTap is mounted (then callback clears). */
  recoverHtml?: string | null;
  onRecoverHtmlConsumed?: () => void;
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
      pendingFiles,
      onRemovePendingFile,
      recoverHtml = null,
      onRecoverHtmlConsumed,
    },
    ref,
  ) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const onDraftChangeRef = useRef(onDraftChange);
    onDraftChangeRef.current = onDraftChange;
    const uploadImageRef = useRef(uploadImage);
    uploadImageRef.current = uploadImage;
    const onAttachFilesRef = useRef(onAttachFiles);
    onAttachFilesRef.current = onAttachFiles;
    const editorRef = useRef<Editor | null>(null);

    /**
     * Queue attachments for the filmstrip preview. Do not insert images into
     * the editor — PendingAttachmentPreviews is the visual source of truth.
     * Still paste meaningful HTML/text from the clipboard when present.
     */
    const applyClipboardFilesRef = useRef<
      (files: File[], html?: string, text?: string) => void
    >(() => {});

    applyClipboardFilesRef.current = (files, html, text) => {
      const attach = onAttachFilesRef.current;
      if (!attach || !files.length) return;

      const ed = editorRef.current;
      if (ed) {
        const cleanedHtml = html ? stripEphemeralInlineMedia(html) : '';
        const hasMeaningfulHtml =
          !!cleanedHtml &&
          (/<(table|ul|ol|pre|blockquote|h[1-6]|strong|em|a\b)/i.test(cleanedHtml) ||
            cleanedHtml.replace(/<[^>]*>/g, '').trim().length > 0);

        if (hasMeaningfulHtml) {
          ed.chain().focus().insertContent(cleanedHtml).run();
        } else if (text) {
          ed.chain().focus().insertContent(text).run();
        }
      }

      attach(files);
      onDraftChangeRef.current?.(true);
    };

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
          HTMLAttributes: {
            class:
              'ticket-editor-image max-w-full h-auto rounded-lg my-2 border border-neutral-200 dark:border-neutral-600',
          },
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
          const upload = uploadImageRef.current;
          const attach = onAttachFilesRef.current;

          // Admin path: upload image and embed inline URL.
          if (upload) {
            const items = event.clipboardData?.items;
            if (!items) return false;
            for (const item of Array.from(items)) {
              if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (!file) continue;
                event.preventDefault();
                upload(file)
                  .then((url) => {
                    if (url) {
                      editorRef.current
                        ?.chain()
                        .focus()
                        .setImage({ src: url, alt: file.name || 'pasted image' })
                        .run();
                    }
                  })
                  .catch(() => {
                    /* parent may toast */
                  });
                return true;
              }
            }
            return false;
          }

          // Advisor create: attach + inline blob preview (ITSTS parity).
          if (!attach) return false;
          const clipboardFiles = filesFromClipboardEvent(event.clipboardData);
          if (!clipboardFiles.length) return false;

          event.preventDefault();
          let html = '';
          try {
            html = event.clipboardData?.getData('text/html') || '';
          } catch {
            html = '';
          }
          const text = event.clipboardData?.getData('text/plain')?.trim() || '';
          applyClipboardFilesRef.current(clipboardFiles, html || undefined, text || undefined);
          return true;
        },
        handleDrop: (_view, event) => {
          const upload = uploadImageRef.current;
          const attach = onAttachFilesRef.current;
          const clipboardFiles = filesFromClipboardEvent(event.dataTransfer);
          if (!clipboardFiles.length) return false;

          if (upload) {
            const imageFiles = clipboardFiles.filter((f) => f.type.startsWith('image/'));
            if (!imageFiles.length) return false;
            event.preventDefault();
            for (const file of imageFiles) {
              upload(file)
                .then((url) => {
                  if (url) {
                    editorRef.current
                      ?.chain()
                      .focus()
                      .setImage({ src: url, alt: file.name })
                      .run();
                  }
                })
                .catch(() => {
                  /* parent may toast */
                });
            }
            return true;
          }

          if (!attach) return false;
          event.preventDefault();
          applyClipboardFilesRef.current(clipboardFiles);
          return true;
        },
      },
      onUpdate: ({ editor: ed }) => {
        onDraftChangeRef.current?.(!ed.isEmpty);
      },
    });

    editorRef.current = editor;

    useEffect(() => {
      if (editor) {
        editor.setEditable(!disabled);
      }
    }, [editor, disabled]);

    useEffect(() => {
      if (!editor || recoverHtml == null || recoverHtml === '') return;
      editor.commands.setContent(recoverHtml, { emitUpdate: true });
      onRecoverHtmlConsumed?.();
    }, [editor, recoverHtml, onRecoverHtmlConsumed]);

    /** Sync once when the editor instance is ready (do not depend on callback identity — unstable parents would loop). */
    useEffect(() => {
      if (editor) {
        onDraftChangeRef.current?.(!editor.isEmpty);
      }
    }, [editor]);

    useImperativeHandle(
      ref,
      () => ({
        getHtml: () => editor?.getHTML() ?? '',
        getText: () => editor?.getText() ?? '',
        clear: () => {
          editor?.chain().focus().clearContent().run();
          onDraftChangeRef.current?.(false);
        },
        focusComposer: () => {
          editor?.chain().focus('end').run();
        },
      }),
      [editor],
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
      async (e: ChangeEvent<HTMLInputElement>) => {
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
      (e: ChangeEvent<HTMLInputElement>) => {
        const list = e.target.files;
        e.target.value = '';
        if (!list?.length || !onAttachFiles) return;
        const files = Array.from(list).map((file, index) => withPastedFileName(file, index));
        // Queue only — filmstrip handles preview (no inline editor images).
        onAttachFiles(files);
        if (files.length) onDraftChangeRef.current?.(true);
        editor?.chain().focus().run();
      },
      [editor, onAttachFiles],
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

        {pendingFiles && pendingFiles.length > 0 ? (
          <PendingAttachmentPreviews
            files={pendingFiles}
            onRemove={onRemovePendingFile}
            variant="embedded"
          />
        ) : null}
      </div>
    );
  },
);
