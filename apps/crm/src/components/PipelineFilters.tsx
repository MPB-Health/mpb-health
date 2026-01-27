import { useState } from 'react';
import type { Lead } from '@mpbhealth/crm-core';

interface PipelineFiltersProps {
  onFilter: (filterFn: ((lead: Lead) => boolean) | null) => void;
}

const PRIORITY_OPTIONS = ['all', 'low', 'medium', 'high', 'urgent'] as const;

export function PipelineFilters({ onFilter }: PipelineFiltersProps) {
  const [priority, setPriority] = useState<string>('all');
  const [tag, setTag] = useState('');

  const applyFilters = (p: string, t: string) => {
    const hasPriority = p !== 'all';
    const hasTag = t.trim().length > 0;

    if (!hasPriority && !hasTag) {
      onFilter(null);
      return;
    }

    onFilter((lead: Lead) => {
      if (hasPriority && lead.priority !== p) return false;
      if (hasTag) {
        const tagLower = t.trim().toLowerCase();
        if (!lead.tags?.some((lt) => lt.toLowerCase().includes(tagLower))) return false;
      }
      return true;
    });
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-neutral-200 rounded-xl shadow-lg p-4 z-20 space-y-3">
      <div>
        <label className="block text-xs font-medium text-neutral-500 mb-1">Priority</label>
        <select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            applyFilters(e.target.value, tag);
          }}
          className="w-full border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === 'all' ? 'All Priorities' : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-500 mb-1">Tag</label>
        <input
          value={tag}
          onChange={(e) => {
            setTag(e.target.value);
            applyFilters(priority, e.target.value);
          }}
          placeholder="Filter by tag..."
          className="w-full border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
        />
      </div>

      <button
        onClick={() => {
          setPriority('all');
          setTag('');
          onFilter(null);
        }}
        className="w-full text-xs text-primary-600 hover:text-primary-700 text-center py-1"
      >
        Clear filters
      </button>
    </div>
  );
}
