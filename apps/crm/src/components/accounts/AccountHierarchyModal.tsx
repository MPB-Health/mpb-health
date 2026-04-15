import { useState } from 'react';
import { Modal } from '../Modal';
import { Building2, ChevronRight, ChevronDown, Users, DollarSign, ExternalLink, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface OrgNode { id: string; name: string; type: string; contacts: number; revenue: number; children: OrgNode[]; }
interface AccountHierarchyModalProps { open: boolean; onClose: () => void; onNavigateToAccount?: (id: string) => void; }

const MOCK_TREE: OrgNode[] = [
  { id: '1', name: 'Acme Health Holdings', type: 'customer', contacts: 8, revenue: 680000, children: [
    { id: '2', name: 'Acme Insurance Division', type: 'customer', contacts: 4, revenue: 340000, children: [
      { id: '5', name: 'Acme Medicare Plans', type: 'customer', contacts: 2, revenue: 180000, children: [] },
      { id: '6', name: 'Acme Dental & Vision', type: 'prospect', contacts: 1, revenue: 0, children: [] },
    ]},
    { id: '3', name: 'Acme Senior Living', type: 'customer', contacts: 3, revenue: 220000, children: [
      { id: '7', name: 'Sunrise Assisted Living', type: 'customer', contacts: 2, revenue: 120000, children: [] },
    ]},
    { id: '4', name: 'Acme Wellness Labs', type: 'prospect', contacts: 1, revenue: 0, children: [] },
  ]},
  { id: '10', name: 'BlueCross Partners Corp', type: 'customer', contacts: 5, revenue: 420000, children: [
    { id: '11', name: 'BlueCross Medicare Div', type: 'customer', contacts: 3, revenue: 280000, children: [] },
    { id: '12', name: 'BlueCross Supplement Div', type: 'partner', contacts: 2, revenue: 140000, children: [] },
  ]},
];

function currencyFmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

const TYPE_COLORS: Record<string, string> = {
  customer: '#22c55e', prospect: '#3b82f6', partner: '#8b5cf6', vendor: '#f59e0b', other: '#6b7280',
};

function TreeNode({ node, depth, onNavigate }: { node: OrgNode; depth: number; onNavigate?: (id: string) => void }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div className={cn('flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-surface-secondary/50 cursor-pointer transition-colors')}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}>
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="w-4 h-4 flex items-center justify-center shrink-0">
            {expanded ? <ChevronDown className="w-3 h-3 text-th-text-tertiary" /> : <ChevronRight className="w-3 h-3 text-th-text-tertiary" />}
          </button>
        ) : <div className="w-4" />}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: (TYPE_COLORS[node.type] || '#6b7280') + '15' }}>
          <Building2 className="w-3.5 h-3.5" style={{ color: TYPE_COLORS[node.type] || '#6b7280' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-th-text-primary truncate">{node.name}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: (TYPE_COLORS[node.type] || '#6b7280') + '15', color: TYPE_COLORS[node.type] || '#6b7280' }}>
              {node.type}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] text-th-text-tertiary flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{node.contacts}</span>
          {node.revenue > 0 && <span className="text-[10px] text-green-500 font-medium tabular-nums">{currencyFmt(node.revenue)}</span>}
          <button onClick={() => onNavigate?.(node.id)} className="text-th-text-tertiary hover:text-th-accent-500">
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
      {expanded && hasChildren && (
        <div>{node.children.map((child) => <TreeNode key={child.id} node={child} depth={depth + 1} onNavigate={onNavigate} />)}</div>
      )}
    </div>
  );
}

export function AccountHierarchyModal({ open, onClose, onNavigateToAccount }: AccountHierarchyModalProps) {
  function countNodes(nodes: OrgNode[]): number {
    return nodes.reduce((s, n) => s + 1 + countNodes(n.children), 0);
  }
  const totalNodes = countNodes(MOCK_TREE);
  const parentCount = MOCK_TREE.length;

  return (
    <Modal open={open} onClose={onClose} title="Account Hierarchy" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Building2 className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{totalNodes}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Entities</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <Building2 className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{parentCount}</p>
            <p className="text-[10px] text-th-text-tertiary">Parent Accounts</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{currencyFmt(MOCK_TREE.reduce((s, n) => s + n.revenue, 0))}</p>
            <p className="text-[10px] text-th-text-tertiary">Top-Level Revenue</p>
          </div>
        </div>

        <div className="max-h-[350px] overflow-y-auto rounded-xl border border-th-border/50 p-1">
          {MOCK_TREE.map((node) => <TreeNode key={node.id} node={node} depth={0} onNavigate={onNavigateToAccount} />)}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Hierarchy Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary"><strong>Acme Health Holdings</strong> has 3 child divisions with only 1 prospect. Consider cross-selling to <strong>Acme Dental & Vision</strong> and <strong>Acme Wellness Labs</strong>.</p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
