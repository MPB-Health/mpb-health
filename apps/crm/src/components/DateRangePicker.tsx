import { useState } from 'react';
import type { ReportDateRange } from '@mpbhealth/crm-core';

interface Props {
  value: ReportDateRange | null;
  onChange: (range: ReportDateRange | null) => void;
}

const PRESETS: { label: string; days: number | null }[] = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: null },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function DateRangePicker({ value, onChange }: Props) {
  const [activePreset, setActivePreset] = useState<number | null>(null);

  const handlePreset = (idx: number) => {
    setActivePreset(idx);
    const preset = PRESETS[idx];
    if (preset.days === null) {
      onChange(null);
    } else {
      onChange({ from: daysAgo(preset.days), to: today() });
    }
  };

  const handleFromChange = (from: string) => {
    setActivePreset(null);
    onChange({ from, to: value?.to || today() });
  };

  const handleToChange = (to: string) => {
    setActivePreset(null);
    onChange({ from: value?.from || daysAgo(30), to });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset, idx) => (
        <button
          key={preset.label}
          onClick={() => handlePreset(idx)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            activePreset === idx
              ? 'bg-th-accent-600 text-white border-th-accent-600'
              : 'bg-surface-primary text-th-text-secondary border-th-border hover:bg-surface-secondary'
          }`}
        >
          {preset.label}
        </button>
      ))}
      <div className="flex items-center gap-1.5 ml-2">
        <input
          type="date"
          value={value?.from || ''}
          onChange={(e) => handleFromChange(e.target.value)}
          className="text-xs border border-th-border rounded-lg px-2 py-1.5 bg-surface-primary text-th-text-secondary"
        />
        <span className="text-th-text-tertiary text-xs">to</span>
        <input
          type="date"
          value={value?.to || ''}
          onChange={(e) => handleToChange(e.target.value)}
          className="text-xs border border-th-border rounded-lg px-2 py-1.5 bg-surface-primary text-th-text-secondary"
        />
      </div>
    </div>
  );
}
