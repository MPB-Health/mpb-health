import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

/** Soft Structuralism double-bezel — machined tray + inset plate. */
export function HrBezel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`hr-bezel ${className}`}>
      <div className="hr-bezel-inner">{children}</div>
    </div>
  );
}

export function HrPageHeader({
  title,
  subtitle,
  action,
  meta,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="hr-page-header mb-8 sm:mb-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {meta}
          <h1 className="hr-display text-[1.85rem] font-semibold tracking-[-0.03em] text-[color:var(--hr-ink)] sm:text-[2.15rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 max-w-lg text-[0.9375rem] leading-relaxed text-[color:var(--hr-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

export function HrPrimaryButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`hr-btn-primary group ${className}`}>
      {children}
    </button>
  );
}

export function HrSecondaryButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`hr-btn-secondary ${className}`}>
      {children}
    </button>
  );
}

export function HrSkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4 sm:p-5" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="hr-skeleton h-[4.25rem] rounded-2xl"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

export function HrSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20" role="status">
      <Loader2 className="h-6 w-6 animate-spin text-[color:var(--hr-accent)]" />
      <span className="text-sm text-[color:var(--hr-muted)]">{label}</span>
    </div>
  );
}

export function HrEmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-16 text-center sm:py-20">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--hr-mist)] text-[color:var(--hr-accent)] ring-1 ring-[color:var(--hr-line)]">
        {icon}
      </div>
      <h2 className="hr-display text-lg font-semibold tracking-tight text-[color:var(--hr-ink)]">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[color:var(--hr-muted)]">
        {body}
      </p>
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}
