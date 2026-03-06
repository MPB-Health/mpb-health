import { useState } from 'react';
import { Modal } from '../Modal';
import type { ForecastType, ForecastCreateInput } from '@mpbhealth/crm-core';

interface CreateForecastModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ForecastCreateInput) => Promise<void>;
}

function getDefaultPeriod(type: ForecastType): { start: string; end: string; name: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (type) {
    case 'monthly': {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        name: `${start.toLocaleString('default', { month: 'long' })} ${year} Forecast`,
      };
    }
    case 'quarterly': {
      const quarter = Math.floor(month / 3);
      const start = new Date(year, quarter * 3, 1);
      const end = new Date(year, (quarter + 1) * 3, 0);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        name: `Q${quarter + 1} ${year} Forecast`,
      };
    }
    case 'annual': {
      return {
        start: `${year}-01-01`,
        end: `${year}-12-31`,
        name: `${year} Annual Forecast`,
      };
    }
  }
}

export function CreateForecastModal({ open, onClose, onSubmit }: CreateForecastModalProps) {
  const [forecastType, setForecastType] = useState<ForecastType>('monthly');
  const [name, setName] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleTypeChange = (type: ForecastType) => {
    setForecastType(type);
    const defaults = getDefaultPeriod(type);
    setName(defaults.name);
    setPeriodStart(defaults.start);
    setPeriodEnd(defaults.end);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !periodStart || !periodEnd) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name,
        period_start: periodStart,
        period_end: periodEnd,
        forecast_type: forecastType,
        status: 'draft',
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  // Set defaults on open
  if (open && !name && !periodStart) {
    const defaults = getDefaultPeriod(forecastType);
    setName(defaults.name);
    setPeriodStart(defaults.start);
    setPeriodEnd(defaults.end);
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Forecast" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Forecast Type */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
            Period Type
          </label>
          <div className="flex gap-2">
            {(['monthly', 'quarterly', 'annual'] as ForecastType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors capitalize ${
                  forecastType === type
                    ? 'bg-th-accent-600 text-white border-th-accent-600'
                    : 'bg-surface-primary text-th-text-secondary border-th-border hover:bg-surface-tertiary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
            Forecast Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        {/* Period */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              required
              className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              required
              className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-th-text-secondary hover:text-th-text-primary border border-th-border rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !name || !periodStart || !periodEnd}
            className="px-4 py-2 text-sm text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Forecast'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
