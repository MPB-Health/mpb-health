import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type Theme } from '@mpbhealth/ui';

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'Auto', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
];

/**
 * Signature control: Soft Structuralism "atmosphere" dial.
 * Cycles light / system / dark without generic sun-moon chrome.
 */
export function HubAtmosphereControl({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div
      className={`hub-atmosphere ${compact ? 'hub-atmosphere-compact' : ''}`}
      role="group"
      aria-label="Color theme"
      data-resolved={resolvedTheme}
    >
      {!compact ? <p className="hub-side-label mb-2">Atmosphere</p> : null}
      <div className="hub-atmosphere-track">
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`hub-atmosphere-btn ${active ? 'hub-atmosphere-btn-active' : ''}`}
              aria-pressed={active}
              title={`${label} theme`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
