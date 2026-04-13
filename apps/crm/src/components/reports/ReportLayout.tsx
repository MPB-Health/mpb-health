import { useState } from 'react';
import { Download, Filter, Calendar } from 'lucide-react';
import { GradientHeader } from '@mpbhealth/ui';

interface ReportLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onExport?: () => void;
  filters?: React.ReactNode;
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  /** When true, only the year dropdown is shown (month is still passed for typing but hidden). */
  yearOnly?: boolean;
  showYtdToggle?: boolean;
  ytdEnabled?: boolean;
  onYtdToggle?: (enabled: boolean) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function ReportLayout({
  title,
  description,
  children,
  onExport,
  filters,
  month,
  year,
  onMonthChange,
  onYearChange,
  yearOnly,
  showYtdToggle,
  ytdEnabled,
  onYtdToggle,
}: ReportLayoutProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-6">
      <GradientHeader
        title={title}
        subtitle={description}
      />

      <div className="flex flex-wrap items-center gap-3 px-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-th-text-tertiary" />
          {!yearOnly && (
            <select
              value={month}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="text-sm border border-th-border rounded-lg px-3 py-1.5 bg-surface-primary"
            >
              {MONTHS.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          )}
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="text-sm border border-th-border rounded-lg px-3 py-1.5 bg-surface-primary"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {showYtdToggle && (
          <label className="flex items-center gap-2 text-sm text-th-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={ytdEnabled}
              onChange={(e) => onYtdToggle?.(e.target.checked)}
              className="rounded border-th-border"
            />
            YTD
          </label>
        )}

        {filters && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 text-sm text-th-text-secondary hover:text-th-text-primary px-3 py-1.5 border border-th-border rounded-lg"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
        )}

        <div className="flex-1" />

        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 text-sm font-medium text-white bg-th-accent-600 hover:bg-th-accent-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export XLSX
          </button>
        )}
      </div>

      {showFilters && filters && (
        <div className="bg-surface-secondary rounded-lg p-4 border border-th-border">
          {filters}
        </div>
      )}

      {children}
    </div>
  );
}
