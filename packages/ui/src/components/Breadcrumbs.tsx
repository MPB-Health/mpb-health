import { cn } from '../utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center flex-wrap gap-1 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && (
              <span className="text-th-text-tertiary select-none" aria-hidden="true">
                /
              </span>
            )}
            {isLast || !item.href ? (
              <span
                className={cn(
                  isLast
                    ? 'text-th-text-primary font-medium'
                    : 'text-th-text-secondary'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                className="text-th-text-secondary hover:text-th-text-primary transition-colors"
              >
                {item.label}
              </a>
            )}
          </span>
        );
      })}
    </nav>
  );
}
