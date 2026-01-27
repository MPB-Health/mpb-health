import type { ConversionFunnelData } from '@mpbhealth/crm-core';

interface Props {
  data: ConversionFunnelData[];
}

export function ConversionFunnel({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-th-text-tertiary text-center py-6">No funnel data.</p>;
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      {data.map((stage, i) => (
        <div key={stage.stage} className="flex items-center gap-3">
          {/* Stage name */}
          <div className="w-28 flex-shrink-0 text-right">
            <p className="text-sm font-medium text-th-text-primary truncate">{stage.display_name}</p>
          </div>

          {/* Bar */}
          <div className="flex-1 relative">
            <div className="h-8 bg-surface-tertiary rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-500"
                style={{
                  width: `${Math.max((stage.count / maxCount) * 100, 2)}%`,
                  backgroundColor: stage.color,
                }}
              />
            </div>
          </div>

          {/* Count + conversion */}
          <div className="w-24 flex-shrink-0 text-right">
            <p className="text-sm font-bold text-th-text-primary">{stage.count}</p>
            {i > 0 && (
              <p className="text-xs text-th-text-tertiary">{stage.conversion_rate}%</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
