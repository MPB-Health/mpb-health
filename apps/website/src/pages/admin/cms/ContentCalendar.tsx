import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  Calendar as CalendarIcon,
  Megaphone,
  Layout,
} from 'lucide-react';
import { supabase } from '@mpbhealth/database';

type ViewMode = 'month' | 'week';

interface CalendarItem {
  id: string;
  title: string;
  type: 'page' | 'blog_post' | 'event' | 'popup';
  status: string;
  date: string;
}

const TYPE_COLORS: Record<string, string> = {
  page: 'bg-purple-100 text-purple-800 border-purple-200',
  blog_post: 'bg-blue-100 text-blue-800 border-blue-200',
  event: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  popup: 'bg-amber-100 text-amber-800 border-amber-200',
};

const TYPE_ICONS: Record<string, typeof FileText> = {
  page: Layout,
  blog_post: FileText,
  event: CalendarIcon,
  popup: Megaphone,
};

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();

  // Fill previous month days
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  // Fill current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  // Fill next month to complete grid
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view] = useState<ViewMode>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const startDate = days[0].toISOString().split('T')[0];
    const endDate = days[days.length - 1].toISOString().split('T')[0];

    try {
      // Load pages
      const { data: pages } = await supabase
        .from('cms_pages')
        .select('id, title, is_published, created_at, updated_at')
        .gte('updated_at', startDate)
        .lte('updated_at', endDate + 'T23:59:59');

      // Load blog posts
      const { data: posts } = await supabase
        .from('blog_articles')
        .select('id, title, is_published, published_date, created_at')
        .or(`published_date.gte.${startDate},created_at.gte.${startDate}`)
        .or(`published_date.lte.${endDate}T23:59:59,created_at.lte.${endDate}T23:59:59`);

      // Load events
      const { data: events } = await supabase
        .from('events')
        .select('id, title, status, start_date')
        .gte('start_date', startDate)
        .lte('start_date', endDate + 'T23:59:59');

      const calItems: CalendarItem[] = [];

      (pages || []).forEach((p: any) => {
        calItems.push({
          id: p.id,
          title: p.title,
          type: 'page',
          status: p.is_published ? 'published' : 'draft',
          date: p.updated_at,
        });
      });

      (posts || []).forEach((p: any) => {
        calItems.push({
          id: p.id,
          title: p.title,
          type: 'blog_post',
          status: p.is_published ? 'published' : 'draft',
          date: p.published_date || p.created_at,
        });
      });

      (events || []).forEach((e: any) => {
        calItems.push({
          id: e.id,
          title: e.title,
          type: 'event',
          status: e.status || 'active',
          date: e.start_date,
        });
      });

      setItems(calItems);
    } catch {
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();

  const getItemsForDay = (day: Date) => {
    return items.filter((item) => {
      const itemDate = new Date(item.date);
      return isSameDay(itemDate, day);
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Content Calendar</h1>
          <p className="text-sm text-th-text-secondary mt-1">
            View and manage all scheduled content across pages, blog posts, and events.
          </p>
        </div>
      </header>

      {/* Month navigation */}
      <div className="flex items-center justify-between bg-surface-primary border border-th-border rounded-xl px-4 py-3">
        <button type="button" onClick={prevMonth} className="p-2 rounded-lg text-th-text-secondary hover:bg-surface-tertiary">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-th-text-primary">{formatMonthYear(currentDate)}</h2>
        <button type="button" onClick={nextMonth} className="p-2 rounded-lg text-th-text-secondary hover:bg-surface-tertiary">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${color}`}>
            {type.replace('_', ' ')}
          </span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-surface-primary border border-th-border rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-th-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-medium text-th-text-tertiary uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === month;
            const isToday = isSameDay(day, today);
            const dayItems = getItemsForDay(day);

            return (
              <div
                key={idx}
                className={`min-h-[100px] border-b border-r border-th-border/40 p-1.5 ${
                  isCurrentMonth ? 'bg-surface-primary' : 'bg-surface-secondary/30'
                }`}
              >
                <div className={`text-xs font-medium mb-1 ${
                  isToday
                    ? 'w-6 h-6 flex items-center justify-center rounded-full bg-th-accent-600 text-white'
                    : isCurrentMonth
                      ? 'text-th-text-primary'
                      : 'text-th-text-tertiary'
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayItems.slice(0, 3).map((item) => {
                    const Icon = TYPE_ICONS[item.type] || FileText;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate border ${TYPE_COLORS[item.type]}`}
                        title={`${item.title} (${item.status})`}
                      >
                        <Icon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                    );
                  })}
                  {dayItems.length > 3 && (
                    <div className="text-xs text-th-text-tertiary px-1.5">
                      +{dayItems.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
