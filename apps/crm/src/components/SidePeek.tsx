import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  User, Building, Briefcase, Phone, Mail,
  MapPin, Calendar, DollarSign, Activity,
  ExternalLink, Tag,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

type EntityType = 'lead' | 'contact' | 'account' | 'deal';

interface PeekData {
  id: string;
  type: EntityType;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  location?: string;
  stage?: string;
  value?: number;
  owner?: string;
  lastActivity?: string;
  tags?: string[];
  createdAt?: string;
}

interface SidePeekProps {
  entityType: EntityType;
  entityId: string;
  children: React.ReactNode;
  data?: PeekData;
  onFetchData?: (type: EntityType, id: string) => Promise<PeekData | null>;
  href?: string;
}

const TYPE_ICONS: Record<EntityType, React.ElementType> = {
  lead: User,
  contact: User,
  account: Building,
  deal: Briefcase,
};

const TYPE_COLORS: Record<EntityType, string> = {
  lead: 'from-sky-500 to-blue-600',
  contact: 'from-emerald-500 to-teal-600',
  account: 'from-violet-500 to-purple-600',
  deal: 'from-amber-500 to-orange-600',
};

export function SidePeek({ entityType, entityId, children, data: initialData, onFetchData, href }: SidePeekProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [data, setData] = useState<PeekData | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const showPeek = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const peekWidth = 320;
        const peekHeight = 280;

        let left = rect.right + 8;
        let top = rect.top;

        if (left + peekWidth > window.innerWidth) {
          left = rect.left - peekWidth - 8;
        }
        if (top + peekHeight > window.innerHeight) {
          top = window.innerHeight - peekHeight - 16;
        }
        top = Math.max(8, top);

        setPosition({ top, left });
      }
      setIsVisible(true);

      if (!data && onFetchData) {
        setLoading(true);
        try {
          const fetched = await onFetchData(entityType, entityId);
          setData(fetched);
        } catch {
          // silent
        } finally {
          setLoading(false);
        }
      }
    }, 400);
  }, [data, entityType, entityId, onFetchData]);

  const hidePeek = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(false), 200);
  }, []);

  const keepPeek = useCallback(() => {
    clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const Icon = TYPE_ICONS[entityType];
  const gradientClass = TYPE_COLORS[entityType];

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showPeek}
        onMouseLeave={hidePeek}
        className="cursor-pointer"
      >
        {children}
      </span>

      {isVisible && createPortal(
        <div
          ref={peekRef}
          onMouseEnter={keepPeek}
          onMouseLeave={hidePeek}
          className={cn(
            'fixed z-[60] w-80 rounded-2xl overflow-hidden',
            'bg-surface-primary border border-th-border/50',
            'shadow-2xl dark:shadow-[0_20px_50px_rgb(0_0_0/0.5)]',
            'animate-fade-in-up'
          )}
          style={{ top: position.top, left: position.left }}
        >
          {/* Header gradient */}
          <div className={cn('h-16 bg-gradient-to-r relative', gradientClass)}>
            <div className="absolute -bottom-5 left-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-md flex items-center justify-center">
                <Icon className="w-5 h-5 text-th-text-secondary" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-4 pt-8 pb-4 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-th-accent-500" />
              <span className="text-sm text-th-text-tertiary">Loading...</span>
            </div>
          ) : data ? (
            <div className="px-4 pt-8 pb-4 space-y-3">
              {/* Name + type */}
              <div>
                <h4 className="text-sm font-semibold text-th-text-primary">{data.name}</h4>
                <span className="text-[10px] uppercase tracking-wider text-th-text-tertiary font-medium">
                  {entityType}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5">
                {data.email && (
                  <div className="flex items-center gap-2 text-xs text-th-text-secondary">
                    <Mail className="w-3.5 h-3.5 text-th-text-tertiary" />
                    <span className="truncate">{data.email}</span>
                  </div>
                )}
                {data.phone && (
                  <div className="flex items-center gap-2 text-xs text-th-text-secondary">
                    <Phone className="w-3.5 h-3.5 text-th-text-tertiary" />
                    <span>{data.phone}</span>
                  </div>
                )}
                {data.company && (
                  <div className="flex items-center gap-2 text-xs text-th-text-secondary">
                    <Building className="w-3.5 h-3.5 text-th-text-tertiary" />
                    <span>{data.company}</span>
                  </div>
                )}
                {data.location && (
                  <div className="flex items-center gap-2 text-xs text-th-text-secondary">
                    <MapPin className="w-3.5 h-3.5 text-th-text-tertiary" />
                    <span>{data.location}</span>
                  </div>
                )}
                {data.value !== undefined && (
                  <div className="flex items-center gap-2 text-xs text-th-text-secondary">
                    <DollarSign className="w-3.5 h-3.5 text-th-text-tertiary" />
                    <span className="font-medium tabular-nums">${data.value.toLocaleString()}</span>
                  </div>
                )}
                {data.stage && (
                  <div className="flex items-center gap-2 text-xs">
                    <Activity className="w-3.5 h-3.5 text-th-text-tertiary" />
                    <span className="px-1.5 py-0.5 rounded bg-th-accent-500/10 text-th-accent-600 dark:text-th-accent-400 font-medium">
                      {data.stage}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {data.tags && data.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag className="w-3 h-3 text-th-text-tertiary shrink-0" />
                  {data.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-th-text-tertiary">
                      {tag}
                    </span>
                  ))}
                  {data.tags.length > 3 && (
                    <span className="text-[10px] text-th-text-tertiary">+{data.tags.length - 3}</span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-th-border/30">
                {data.lastActivity && (
                  <span className="text-[10px] text-th-text-tertiary">
                    Last activity: {data.lastActivity}
                  </span>
                )}
                {href && (
                  <a href={href} className="flex items-center gap-1 text-[10px] text-th-accent-500 hover:text-th-accent-600 font-medium">
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="px-4 pt-8 pb-4">
              <p className="text-sm text-th-text-tertiary">No data available</p>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
