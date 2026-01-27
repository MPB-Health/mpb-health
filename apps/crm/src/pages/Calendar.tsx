import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { AddEventModal } from '../components/AddEventModal';
import type { CalendarEvent } from '@mpbhealth/crm-core';

export default function Calendar() {
  const { tasksDueToday, overdueTasks, calendarService, refreshCalendar } = useCRM();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);

  // Load events when month changes
  useEffect(() => {
    const loadEvents = async () => {
      const events = await calendarService.getEventsForMonth(
        currentDate.getFullYear(),
        currentDate.getMonth()
      );
      setMonthEvents(events);
    };
    loadEvents();
  }, [currentDate, calendarService]);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const allTasks = [...tasksDueToday, ...overdueTasks];

  const getTasksForDay = (day: number) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    date.setHours(0, 0, 0, 0);

    return allTasks.filter((task) => {
      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === date.getTime();
    });
  };

  const getEventsForDay = (day: number) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    return monthEvents.filter((event) => {
      const eventDate = new Date(event.start_time);
      return eventDate >= date && eventDate < nextDay;
    });
  };

  const handleDayClick = (day: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(d.toISOString().split('T')[0]);
    setShowAddEvent(true);
  };

  const handleEventCreated = async () => {
    const events = await calendarService.getEventsForMonth(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );
    setMonthEvents(events);
    refreshCalendar();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Calendar</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            View and manage your schedule
          </p>
        </div>
        <button
          onClick={() => { setSelectedDate(undefined); setShowAddEvent(true); }}
          className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-th-text-primary">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-surface-tertiary rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-th-text-secondary" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm font-medium text-th-accent-600 hover:bg-th-accent-50 rounded-lg"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-surface-tertiary rounded-lg"
            >
              <ChevronRight className="w-5 h-5 text-th-text-secondary" />
            </button>
          </div>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-th-text-tertiary py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the first day of the month */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="h-24 bg-surface-secondary rounded-lg" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayTasks = getTasksForDay(day);
            const dayEvents = getEventsForDay(day);
            const allItems = [...dayTasks.map(t => ({ id: t.id, title: t.title, type: 'task' as const, overdue: !t.completed && new Date(t.due_date) < new Date(), completed: t.completed })), ...dayEvents.map(e => ({ id: e.id, title: e.title, type: 'event' as const, overdue: false, completed: e.status === 'completed' }))];
            const hasOverdue = allItems.some((item) => item.overdue);

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`h-24 p-2 rounded-lg border cursor-pointer ${
                  isToday(day)
                    ? 'bg-th-accent-50 border-th-accent-200'
                    : 'bg-surface-primary border-th-border hover:bg-surface-secondary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      isToday(day) ? 'text-th-accent-700' : 'text-th-text-secondary'
                    }`}
                  >
                    {day}
                  </span>
                  {allItems.length > 0 && (
                    <span
                      className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                        hasOverdue
                          ? 'bg-red-100 text-red-700'
                          : 'bg-th-accent-100 text-th-accent-700'
                      }`}
                    >
                      {allItems.length}
                    </span>
                  )}
                </div>
                <div className="mt-1 space-y-1">
                  {allItems.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className={`text-xs px-1 py-0.5 rounded truncate ${
                        item.completed
                          ? 'bg-surface-tertiary text-th-text-tertiary line-through'
                          : item.overdue
                          ? 'bg-red-100 text-red-700'
                          : item.type === 'event'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {item.title}
                    </div>
                  ))}
                  {allItems.length > 2 && (
                    <div className="text-xs text-th-text-tertiary">
                      +{allItems.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming tasks sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h3 className="font-semibold text-th-text-primary mb-4">Tasks Due Today</h3>
          {tasksDueToday.length === 0 ? (
            <p className="text-th-text-tertiary text-sm">No tasks due today</p>
          ) : (
            <div className="space-y-3">
              {tasksDueToday.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg"
                >
                  <span className="text-sm font-medium text-th-text-primary">
                    {task.title}
                  </span>
                  <span className="text-xs text-th-text-tertiary">
                    {task.task_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h3 className="font-semibold text-th-text-primary mb-4">Overdue Tasks</h3>
          {overdueTasks.length === 0 ? (
            <p className="text-th-text-tertiary text-sm">No overdue tasks</p>
          ) : (
            <div className="space-y-3">
              {overdueTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-red-900">
                    {task.title}
                  </span>
                  <span className="text-xs text-red-600">
                    {new Date(task.due_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddEventModal
        open={showAddEvent}
        onClose={() => setShowAddEvent(false)}
        defaultDate={selectedDate}
        onSuccess={handleEventCreated}
      />
    </div>
  );
}
