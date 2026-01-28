import { Link } from 'react-router-dom';
import { GripVertical, Calendar, Building2, User } from 'lucide-react';
import type { DealWithRelations } from '@mpbhealth/crm-core';

interface DealCardProps {
  deal: DealWithRelations;
  isDragging?: boolean;
}

export function DealCard({ deal, isDragging }: DealCardProps) {
  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: deal.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue =
    deal.expected_close_date &&
    new Date(deal.expected_close_date) < new Date() &&
    !deal.won_at &&
    !deal.lost_at;

  return (
    <div
      className={`bg-surface-primary rounded-lg border border-th-border p-4 transition-shadow ${
        isDragging ? 'shadow-lg ring-2 ring-th-accent-500' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div className="cursor-grab text-th-text-tertiary hover:text-th-text-secondary mt-0.5">
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Deal name */}
          <Link
            to={`/deals/${deal.id}`}
            className="font-medium text-th-text-primary hover:text-th-accent-600 line-clamp-1"
          >
            {deal.name}
          </Link>

          {/* Account */}
          {deal.account && (
            <div className="flex items-center gap-1 mt-1 text-sm text-th-text-tertiary">
              <Building2 className="w-3 h-3" />
              <span className="truncate">{deal.account.name}</span>
            </div>
          )}

          {/* Amount */}
          <div className="mt-2 text-lg font-semibold text-th-text-primary">
            {formatCurrency(deal.amount)}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-th-border-subtle">
            {/* Close date */}
            <div
              className={`flex items-center gap-1 text-xs ${
                isOverdue ? 'text-red-600' : 'text-th-text-tertiary'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{formatDate(deal.expected_close_date)}</span>
            </div>

            {/* Owner avatar */}
            {deal.owner_id && (
              <div className="w-6 h-6 bg-th-accent-100 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-th-accent-700" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
