export interface BudgetSchedulePanelProps {
  budgetType: 'daily' | 'lifetime';
  budgetAmount: string;
  startDate: string;
  endDate: string;
  bidStrategy: 'lowest_cost' | 'cost_cap';
  onBudgetTypeChange: (t: 'daily' | 'lifetime') => void;
  onBudgetAmountChange: (v: string) => void;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onBidStrategyChange: (s: 'lowest_cost' | 'cost_cap') => void;
}

export function BudgetSchedulePanel({
  budgetType,
  budgetAmount,
  startDate,
  endDate,
  bidStrategy,
  onBudgetTypeChange,
  onBudgetAmountChange,
  onStartDateChange,
  onEndDateChange,
  onBidStrategyChange,
}: BudgetSchedulePanelProps) {
  const amt = parseFloat(budgetAmount) || 0;
  const reach = Math.round(8000 + amt * 420 + (budgetType === 'lifetime' ? amt * 80 : 0));
  const clicks = Math.round(reach * 0.012);
  const conv = Math.round(clicks * 0.04);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-medium text-th-text-primary">Budget type</label>
        <div className="flex rounded-lg border border-th-border p-1 bg-surface-tertiary">
          {(['daily', 'lifetime'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onBudgetTypeChange(t)}
              className={`flex-1 rounded-md py-2 text-sm font-medium capitalize transition-colors ${
                budgetType === t ? 'bg-surface-primary shadow text-th-text-primary' : 'text-th-text-secondary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-th-text-primary">Amount (USD)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-th-text-tertiary text-sm">$</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={budgetAmount}
            onChange={(e) => onBudgetAmountChange(e.target.value)}
            className="w-full rounded-lg border border-th-border bg-surface-primary py-2 pl-8 pr-3 text-sm"
            placeholder="250"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-th-text-primary">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-th-text-primary">End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-th-text-primary">Bid strategy</label>
        <select
          value={bidStrategy}
          onChange={(e) => onBidStrategyChange(e.target.value as 'lowest_cost' | 'cost_cap')}
          className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
        >
          <option value="lowest_cost">Lowest cost (recommended)</option>
          <option value="cost_cap">Cost cap</option>
        </select>
      </div>

      <div className="rounded-xl border border-th-border p-4 space-y-3 bg-surface-tertiary">
        <p className="text-sm font-semibold text-th-text-primary">Estimated results (mock)</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{reach.toLocaleString()}</p>
            <p className="text-[10px] text-th-text-tertiary uppercase">Reach</p>
          </div>
          <div>
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{clicks}</p>
            <p className="text-[10px] text-th-text-tertiary uppercase">Clicks</p>
          </div>
          <div>
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{conv}</p>
            <p className="text-[10px] text-th-text-tertiary uppercase">Conv.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
