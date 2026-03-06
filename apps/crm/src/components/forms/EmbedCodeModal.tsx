import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface EmbedCodeModalProps {
  open: boolean;
  onClose: () => void;
  iframe: string;
  script: string;
}

export function EmbedCodeModal({ open, onClose, iframe, script }: EmbedCodeModalProps) {
  const [tab, setTab] = useState<'iframe' | 'script'>('iframe');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const code = tab === 'iframe' ? iframe : script;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface-primary rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-th-border">
          <h2 className="text-lg font-semibold text-th-text-primary">Embed Code</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-secondary">
            <X className="w-5 h-5 text-th-text-tertiary" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTab('iframe')}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                tab === 'iframe'
                  ? 'bg-th-accent-100 text-th-accent-700'
                  : 'text-th-text-secondary hover:bg-surface-secondary'
              }`}
            >
              iFrame
            </button>
            <button
              onClick={() => setTab('script')}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                tab === 'script'
                  ? 'bg-th-accent-100 text-th-accent-700'
                  : 'text-th-text-secondary hover:bg-surface-secondary'
              }`}
            >
              JavaScript
            </button>
          </div>

          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 text-xs p-4 rounded-lg overflow-x-auto max-h-64">
              <code>{code}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <p className="text-xs text-th-text-tertiary mt-3">
            {tab === 'iframe'
              ? 'Paste this HTML snippet where you want the form to appear.'
              : 'This script creates an auto-resizing iframe. Paste it where you want the form.'}
          </p>
        </div>
      </div>
    </div>
  );
}
