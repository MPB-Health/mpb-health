import type { ReactNode } from 'react';

interface PageChromeProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  tabs?: ReactNode;
  children?: ReactNode;
}

/**
 * Soft Structuralism page chrome for dense admin product UI.
 * One composition: title block, optional actions, optional tab strip.
 */
export default function PageChrome({
  title,
  description,
  actions,
  tabs,
  children,
}: PageChromeProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h1 className="text-[1.65rem] font-semibold tracking-tight text-th-text-primary leading-tight">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-th-text-tertiary max-w-2xl leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
        ) : null}
      </div>
      {tabs}
      {children}
    </div>
  );
}

interface PortalTabsProps<T extends string> {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}

export function PortalTabs<T extends string>({ tabs, active, onChange }: PortalTabsProps<T>) {
  return (
    <div className="admin-portal-tabs" role="tablist" aria-label="Portal filters">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`admin-portal-tab ${isActive ? 'admin-portal-tab-active' : ''}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function BezelPanel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`admin-bezel ${className}`}>
      <div className="admin-bezel-inner">{children}</div>
    </div>
  );
}

/** Soft Structuralism search field used across list pages */
export const adminSearchInputClass =
  'w-full pl-10 pr-4 py-2.5 bg-surface-primary/90 border border-th-border/80 rounded-full focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent text-th-text-primary placeholder-th-text-tertiary shadow-[0_1px_2px_rgb(15_23_42/0.03)]';

export const adminSelectClass =
  'px-4 py-2.5 bg-surface-primary border border-th-border/80 rounded-full focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary';
