import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '../utils';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  sortable?: boolean;
  className?: string;
  skeletonRows?: number;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  key: string;
  direction: SortDirection;
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  onRowClick,
  sortable = false,
  className,
  skeletonRows = 5,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>({ key: '', direction: null });

  const handleHeaderClick = (col: Column<T>) => {
    const isSortable = sortable || col.sortable;
    if (!isSortable) return;

    const key = String(col.key);
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      if (prev.direction === 'desc') return { key: '', direction: null };
      return { key, direction: 'asc' };
    });
  };

  const sortedData = useMemo(() => {
    if (!sort.key || !sort.direction) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const cmp = aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sort]);

  const getSortIcon = (col: Column<T>) => {
    const isSortable = sortable || col.sortable;
    if (!isSortable) return null;
    const key = String(col.key);
    if (sort.key !== key || sort.direction === null) {
      return <ChevronsUpDown className="w-3.5 h-3.5 ml-1 text-th-text-tertiary opacity-50" />;
    }
    if (sort.direction === 'asc') {
      return <ChevronUp className="w-3.5 h-3.5 ml-1 text-th-accent-600" />;
    }
    return <ChevronDown className="w-3.5 h-3.5 ml-1 text-th-accent-600" />;
  };

  return (
    <div
      className={cn(
        'bg-surface-primary rounded-xl border border-th-border overflow-hidden',
        className
      )}
    >
      {loading ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-secondary border-b border-th-border">
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className={cn(
                      'text-left px-6 py-3 text-xs font-medium text-th-text-secondary uppercase tracking-wider',
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border">
              {Array.from({ length: skeletonRows }).map((_, rowIdx) => (
                <tr key={rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4">
                      <div className="h-4 rounded animate-pulse bg-surface-tertiary" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : sortedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-th-text-tertiary">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-secondary border-b border-th-border">
                {columns.map((col, i) => {
                  const isSortable = sortable || col.sortable;
                  return (
                    <th
                      key={i}
                      onClick={() => handleHeaderClick(col)}
                      className={cn(
                        'text-left px-6 py-3 text-xs font-medium text-th-text-secondary uppercase tracking-wider whitespace-nowrap',
                        isSortable && 'cursor-pointer select-none hover:text-th-text-primary',
                        col.className
                      )}
                    >
                      <span className="inline-flex items-center">
                        {col.header}
                        {getSortIcon(col)}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border">
              {sortedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'hover:bg-surface-secondary',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={cn(
                        'px-6 py-4 text-sm text-th-text-primary truncate max-w-xs',
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : String(row[col.key as keyof T] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

DataTable.displayName = 'DataTable';

const MemoizedDataTable = React.memo(DataTable) as typeof DataTable;

export { MemoizedDataTable as DataTable };
