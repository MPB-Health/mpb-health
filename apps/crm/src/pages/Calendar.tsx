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
          <h1 className="text-2xl font-bold text-neutral-900">Calendar</h1>
          <p className="text-neutral-500 text-sm mt-1">
            View and manage your schedule
          </p>
        </div>
        <button
          onClick={() => { setSelectedDate(undefined); setShowAddEvent(true); }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 rounded-lg text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-neutral-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-neutral-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-neutral-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the first day of the month */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="h-24 bg-neutral-50 rounded-lg" />
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
                    ? 'bg-primary-50 border-primary-200'
                    : 'bg-white border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      isToday(day) ? 'text-primary-700' : 'text-neutral-700'
                    }`}
                  >
                    {day}
                  </span>
                  {allItems.length > 0 && (
                    <span
                      className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                        hasOverdue
                          ? 'bg-red-100 text-red-700'
                          : 'bg-primary-100 text-primary-700'
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
                          ? 'bg-neutral-100 text-neutral-500 line-through'
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
                    <div className="text-xs text-neutral-400">
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
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">Tasks Due Today</h3>
          {tasksDueToday.length === 0 ? (
            <p className="text-neutral-500 text-sm">No tasks due today</p>
          ) : (
            <div className="space-y-3">
              {tasksDueToday.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-neutral-900">
                    {task.title}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {task.task_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">Overdue Tasks</h3>
          {overdueTasks.length === 0 ? (
            <p className="text-neutral-500 text-sm">No overdue tasks</p>
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
