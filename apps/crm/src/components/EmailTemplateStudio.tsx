import { useState } from 'react';
import { Modal } from './Modal';
import {
  Type, Image, Columns, Minus, Square, Link, MousePointerClick,
  GripVertical, Trash2, Plus, Eye, Code, Save, Send, Sparkles,
  ChevronUp, ChevronDown, Palette, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, List, Mail, Loader2,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

type BlockType = 'header' | 'text' | 'image' | 'button' | 'divider' | 'columns' | 'spacer';

interface EmailBlock {
  id: string;
  type: BlockType;
  content: string;
  align?: 'left' | 'center' | 'right';
  buttonUrl?: string;
  buttonColor?: string;
  imageUrl?: string;
  columns?: { content: string }[];
}

interface EmailTemplateStudioProps {
  open: boolean;
  onClose: () => void;
  templateName?: string;
  initialBlocks?: EmailBlock[];
  onSave?: (name: string, blocks: EmailBlock[], html: string) => Promise<void>;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ElementType }[] = [
  { type: 'header', label: 'Header', icon: Type },
  { type: 'text', label: 'Text', icon: AlignLeft },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'button', label: 'Button', icon: MousePointerClick },
  { type: 'divider', label: 'Divider', icon: Minus },
  { type: 'columns', label: '2 Columns', icon: Columns },
  { type: 'spacer', label: 'Spacer', icon: Square },
];

const MERGE_FIELDS = [
  '{{first_name}}', '{{last_name}}', '{{email}}', '{{phone}}',
  '{{plan_type}}', '{{carrier}}', '{{premium}}', '{{agent_name}}',
  '{{appointment_date}}', '{{portal_link}}',
];

const DEFAULT_BLOCKS: EmailBlock[] = [
  { id: '1', type: 'image', content: '', imageUrl: 'https://via.placeholder.com/600x120/6366f1/ffffff?text=MPB+Health', align: 'center' },
  { id: '2', type: 'header', content: 'Hi {{first_name}},', align: 'left' },
  { id: '3', type: 'text', content: 'Thank you for your interest in finding the right health coverage. Based on our conversation, I\'ve put together some options that I think would be a great fit for your needs.', align: 'left' },
  { id: '4', type: 'button', content: 'View Your Plan Options', buttonUrl: '{{portal_link}}', buttonColor: '#6366f1', align: 'center' },
  { id: '5', type: 'divider', content: '' },
  { id: '6', type: 'text', content: 'If you have any questions, don\'t hesitate to reach out. I\'m here to help you make the best decision for your health coverage.\n\nBest regards,\n{{agent_name}}', align: 'left' },
];

export function EmailTemplateStudio({
  open, onClose, templateName = 'New Template', initialBlocks, onSave,
}: EmailTemplateStudioProps) {
  const [name, setName] = useState(templateName);
  const [blocks, setBlocks] = useState<EmailBlock[]>(initialBlocks || DEFAULT_BLOCKS);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const addBlock = (type: BlockType) => {
    const block: EmailBlock = {
      id: String(Date.now()),
      type,
      content: type === 'header' ? 'New Header' : type === 'text' ? 'Enter your text here...' : type === 'button' ? 'Click Here' : '',
      align: 'left',
      buttonUrl: type === 'button' ? '#' : undefined,
      buttonColor: type === 'button' ? '#6366f1' : undefined,
      columns: type === 'columns' ? [{ content: 'Column 1' }, { content: 'Column 2' }] : undefined,
    };
    setBlocks((prev) => [...prev, block]);
    setSelectedBlock(block.id);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  const updateBlock = (id: string, updates: Partial<EmailBlock>) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, ...updates } : b));
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  const generateHtml = () => {
    return blocks.map((b) => {
      switch (b.type) {
        case 'header': return `<h2 style="text-align:${b.align};font-size:24px;color:#1a1a1a;margin:16px 0">${b.content}</h2>`;
        case 'text': return `<p style="text-align:${b.align};font-size:16px;color:#333;line-height:1.6;margin:12px 0">${b.content.replace(/\n/g, '<br/>')}</p>`;
        case 'button': return `<div style="text-align:${b.align};margin:20px 0"><a href="${b.buttonUrl}" style="background:${b.buttonColor};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${b.content}</a></div>`;
        case 'image': return `<div style="text-align:${b.align};margin:16px 0"><img src="${b.imageUrl}" style="max-width:100%;border-radius:8px" /></div>`;
        case 'divider': return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />`;
        case 'spacer': return `<div style="height:24px"></div>`;
        case 'columns': return `<table width="100%"><tr>${(b.columns || []).map((c) => `<td style="width:50%;padding:8px;vertical-align:top">${c.content}</td>`).join('')}</tr></table>`;
        default: return '';
      }
    }).join('\n');
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave?.(name, blocks, generateHtml()); onClose(); }
    catch { /* parent */ }
    finally { setSaving(false); }
  };

  const selected = blocks.find((b) => b.id === selectedBlock);

  return (
    <Modal open={open} onClose={onClose} title="Email Template Studio" size="2xl">
      <div className="space-y-3">
        {/* Template name */}
        <div className="flex items-center gap-3">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="flex-1 text-sm font-semibold rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none" />
          <button onClick={() => setPreviewMode(!previewMode)} className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all',
            previewMode ? 'border-th-accent-500/50 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border text-th-text-secondary'
          )}>
            {previewMode ? <Code className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {previewMode ? 'Edit' : 'Preview'}
          </button>
        </div>

        <div className="flex gap-3" style={{ minHeight: 380 }}>
          {/* Canvas */}
          <div className="flex-1 rounded-xl border border-th-border/50 bg-white dark:bg-gray-900 overflow-y-auto max-h-[380px]">
            {previewMode ? (
              <div className="p-6" dangerouslySetInnerHTML={{ __html: generateHtml() }} />
            ) : (
              <div className="p-3 space-y-1">
                {blocks.map((block, idx) => (
                  <div key={block.id}
                    onClick={() => setSelectedBlock(block.id)}
                    className={cn(
                      'group flex items-start gap-1 p-2 rounded-lg border transition-all cursor-pointer',
                      selectedBlock === block.id ? 'border-th-accent-500/50 bg-th-accent-500/5' : 'border-transparent hover:border-th-border/50'
                    )}
                  >
                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }} className="p-0.5 text-th-text-tertiary hover:text-th-text-secondary"><ChevronUp className="w-3 h-3" /></button>
                      <GripVertical className="w-3 h-3 text-th-text-tertiary" />
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }} className="p-0.5 text-th-text-tertiary hover:text-th-text-secondary"><ChevronDown className="w-3 h-3" /></button>
                    </div>
                    <div className="flex-1 min-w-0" style={{ textAlign: block.align }}>
                      {block.type === 'header' && <h3 className="text-lg font-bold text-gray-900 dark:text-white">{block.content}</h3>}
                      {block.type === 'text' && <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{block.content}</p>}
                      {block.type === 'button' && (
                        <span className="inline-block px-5 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: block.buttonColor }}>{block.content}</span>
                      )}
                      {block.type === 'image' && (
                        block.imageUrl ? <img src={block.imageUrl} className="max-w-full rounded-lg" alt="" /> : <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-400">Image placeholder</div>
                      )}
                      {block.type === 'divider' && <hr className="border-gray-200 dark:border-gray-700" />}
                      {block.type === 'spacer' && <div className="h-6" />}
                      {block.type === 'columns' && (
                        <div className="grid grid-cols-2 gap-2">
                          {block.columns?.map((col, ci) => (
                            <div key={ci} className="p-2 rounded border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-500">{col.content}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                      className="p-1 text-th-text-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          {!previewMode && (
            <div className="w-48 shrink-0 space-y-3 overflow-y-auto max-h-[380px]">
              {/* Add blocks */}
              <div>
                <p className="text-[10px] font-semibold text-th-text-tertiary uppercase tracking-wider mb-1.5">Add Block</p>
                <div className="space-y-1">
                  {BLOCK_TYPES.map((bt) => (
                    <button key={bt.type} onClick={() => addBlock(bt.type)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-th-text-secondary hover:bg-surface-secondary hover:text-th-text-primary transition-colors">
                      <bt.icon className="w-3.5 h-3.5 text-th-text-tertiary" /> {bt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Block properties */}
              {selected && (
                <div>
                  <p className="text-[10px] font-semibold text-th-text-tertiary uppercase tracking-wider mb-1.5">Properties</p>
                  <div className="space-y-2">
                    {(selected.type === 'header' || selected.type === 'text' || selected.type === 'button') && (
                      <textarea value={selected.content} onChange={(e) => updateBlock(selected.id, { content: e.target.value })}
                        rows={selected.type === 'text' ? 4 : 2}
                        className="w-full text-xs rounded-lg border border-th-border/50 bg-surface-primary px-2 py-1.5 resize-none focus:border-th-accent-500/50 focus:outline-none" />
                    )}
                    {selected.type === 'button' && (
                      <>
                        <input type="text" value={selected.buttonUrl || ''} onChange={(e) => updateBlock(selected.id, { buttonUrl: e.target.value })}
                          placeholder="Button URL..." className="w-full text-xs rounded-lg border border-th-border/50 bg-surface-primary px-2 py-1.5 focus:border-th-accent-500/50 focus:outline-none" />
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-th-text-tertiary">Color:</span>
                          <input type="color" value={selected.buttonColor || '#6366f1'} onChange={(e) => updateBlock(selected.id, { buttonColor: e.target.value })}
                            className="w-6 h-6 rounded border-0 cursor-pointer" />
                        </div>
                      </>
                    )}
                    {selected.type === 'image' && (
                      <input type="text" value={selected.imageUrl || ''} onChange={(e) => updateBlock(selected.id, { imageUrl: e.target.value })}
                        placeholder="Image URL..." className="w-full text-xs rounded-lg border border-th-border/50 bg-surface-primary px-2 py-1.5 focus:border-th-accent-500/50 focus:outline-none" />
                    )}
                    {/* Alignment */}
                    <div className="flex gap-1">
                      {(['left', 'center', 'right'] as const).map((a) => (
                        <button key={a} onClick={() => updateBlock(selected.id, { align: a })}
                          className={cn('flex-1 py-1 rounded text-xs font-medium', selected.align === a ? 'bg-th-accent-500/10 text-th-accent-500' : 'text-th-text-tertiary')}>
                          {a === 'left' ? <AlignLeft className="w-3 h-3 mx-auto" /> : a === 'center' ? <AlignCenter className="w-3 h-3 mx-auto" /> : <AlignRight className="w-3 h-3 mx-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Merge fields */}
              <div>
                <p className="text-[10px] font-semibold text-th-text-tertiary uppercase tracking-wider mb-1.5">Merge Fields</p>
                <div className="flex flex-wrap gap-1">
                  {MERGE_FIELDS.map((f) => (
                    <button key={f} onClick={() => {
                      if (selected && (selected.type === 'header' || selected.type === 'text' || selected.type === 'button')) {
                        updateBlock(selected.id, { content: selected.content + ' ' + f });
                      }
                    }}
                      className="px-1.5 py-0.5 rounded bg-violet-500/10 text-[10px] font-mono text-violet-500 hover:bg-violet-500/20 transition-colors">
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <div className="flex-1" />
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
