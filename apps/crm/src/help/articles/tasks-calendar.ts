import type { PageHelp, HelpArticle } from '../types';

export const tasksPageHelp: PageHelp = {
  pageKey: 'tasks',
  title: 'Tasks',
  description:
    'Create, assign, and track tasks to stay on top of follow-ups, enrollment deadlines, and daily activities.',
  quickTips: [
    {
      id: 'tasks-tip-1',
      text: `Use the "End of Day" view to review all tasks due today and plan tomorrow's priorities before logging off.`,
    },
    {
      id: 'tasks-tip-2',
      text: 'Link tasks to specific leads or deals so the full context is one click away when you start working.',
    },
    {
      id: 'tasks-tip-3',
      text: 'Set recurring tasks for weekly pipeline reviews or monthly commission reconciliation.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'taskTitle',
      label: 'Title',
      hint: 'A clear, action-oriented description (e.g., "Call John re: Medigap Plan G quote follow-up").',
    },
    {
      fieldKey: 'dueDate',
      label: 'Due Date',
      hint: 'When the task should be completed. Overdue tasks are highlighted in red on your dashboard.',
    },
    {
      fieldKey: 'priority',
      label: 'Priority',
      hint: 'Low, Medium, High, or Urgent. High and Urgent tasks appear at the top of your task list.',
    },
    {
      fieldKey: 'assignee',
      label: 'Assigned To',
      hint: 'The team member responsible. You can assign tasks to yourself or to other agents on your team.',
    },
    {
      fieldKey: 'relatedRecord',
      label: 'Related Record',
      hint: 'Link to a lead, contact, deal, or account for quick context access.',
    },
    {
      fieldKey: 'status',
      label: 'Status',
      hint: 'Not Started, In Progress, Completed, or Deferred. Mark tasks complete to keep your list clean.',
    },
  ],
  faqs: [
    {
      question: 'Can I create tasks from other parts of the CRM?',
      answer:
        'Yes. You can create a task from any record detail page (lead, contact, deal, account) using the "Add Task" button. The task is automatically linked to that record.',
    },
    {
      question: 'How do recurring tasks work?',
      answer:
        'When creating a task, toggle "Recurring" and set the frequency (daily, weekly, monthly). A new task instance is generated each period after the current one is completed.',
    },
    {
      question: 'Will I get reminders for upcoming tasks?',
      answer:
        'Yes. The CRM sends browser notifications and optional email reminders before a task is due. Configure reminder timing under Settings > Notifications.',
    },
  ],
  relatedArticles: ['tc-managing-tasks', 'tc-using-calendar', 'tc-scheduling-meetings'],
};

export const calendarPageHelp: PageHelp = {
  pageKey: 'calendar',
  title: 'Calendar',
  description:
    'View and manage your appointments, meetings, and enrollment deadlines in a unified calendar.',
  quickTips: [
    {
      id: 'calendar-tip-1',
      text: 'Overlay your Google or Outlook calendar so all personal and CRM events appear in one place.',
    },
    {
      id: 'calendar-tip-2',
      text: 'Color-code events by type—blue for client meetings, green for seminars, red for enrollment deadlines.',
    },
    {
      id: 'calendar-tip-3',
      text: 'Share your booking link with prospects so they can self-schedule at times that work for both of you.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'eventTitle',
      label: 'Event Title',
      hint: 'The name of the meeting or event as it will appear on the calendar.',
    },
    {
      fieldKey: 'dateTime',
      label: 'Date & Time',
      hint: 'Start and end time for the event. All-day events can be toggled separately.',
    },
    {
      fieldKey: 'attendees',
      label: 'Attendees',
      hint: 'Add contacts, leads, or team members. They will receive calendar invitations via email.',
    },
    {
      fieldKey: 'location',
      label: 'Location',
      hint: 'Physical address, video call link, or phone number. The CRM can auto-generate Zoom or Teams links.',
    },
    {
      fieldKey: 'reminder',
      label: 'Reminder',
      hint: 'Set a reminder notification before the event (e.g., 15 minutes, 1 hour, 1 day).',
    },
  ],
  faqs: [
    {
      question: 'How do I sync with Google Calendar or Outlook?',
      answer:
        'Go to Settings > Calendar > Integrations and connect your account. Events sync bidirectionally so changes in either system are reflected in the other.',
    },
    {
      question: 'Can prospects book time on my calendar directly?',
      answer:
        'Yes. Enable the Booking Page under Calendar > Booking Links. Customize your availability, meeting duration, and buffer time. Share the link in emails, on your website, or in your email signature.',
    },
    {
      question: 'How do I block time for personal events?',
      answer:
        'Create an event and mark it as "Busy" or "Personal." This blocks the time slot on your booking page so prospects cannot schedule over it.',
    },
  ],
  relatedArticles: ['tc-using-calendar', 'tc-scheduling-meetings', 'tc-managing-tasks'],
};

export const tasksCalendarArticles: HelpArticle[] = [
  {
    id: 'tc-managing-tasks',
    module: 'tasks-calendar',
    title: 'Managing Tasks',
    summary:
      'Learn how to create, organize, and complete tasks to keep your enrollment activities and follow-ups on track.',
    content: `Tasks are the backbone of a productive day in the CRM. Every phone call to make, every quote to follow up on, every enrollment form to submit—these all become tasks that you can track, prioritize, and check off. A disciplined task management practice ensures that no prospect falls through the cracks, especially during the high-volume AEP and OEP seasons.

To create a task, navigate to Tasks and click "New Task," or use the quick-action button available on any record detail page. Give the task a clear, action-oriented title—"Call Jane Smith re: Plan G renewal" is much more useful than "Follow up." Set the due date, priority level, and optionally link it to a lead, contact, deal, or account. Linking tasks to records is highly recommended because it gives you instant context when you sit down to work: one click takes you to the prospect's full history, past communications, and current quote.

The task list view supports multiple layouts: a flat list sorted by due date, a Kanban board grouped by status, and a calendar overlay that shows tasks alongside your appointments. Use whichever view matches your workflow. Many agents prefer the "End of Day" view, which shows all tasks due today that are still open, plus any overdue items carried forward. Completing your End of Day review each afternoon lets you plan tomorrow's priorities and start the next day focused.

For repetitive activities—like weekly pipeline reviews, monthly commission audits, or quarterly license renewal checks—set up recurring tasks. Toggle the "Recurring" option when creating the task, select the frequency, and the CRM generates a fresh instance each cycle. The original task's notes and linked record carry forward, so you do not lose context between occurrences. Managers can also create task templates for common workflows (e.g., "New Client Onboarding Checklist") and assign them to agents, ensuring consistent processes across the team.`,
    tags: [
      'tasks',
      'follow-up',
      'productivity',
      'end-of-day',
      'recurring',
      'prioritization',
      'AEP',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'tc-using-calendar',
    module: 'tasks-calendar',
    title: 'Using the Calendar',
    summary:
      `Manage appointments, enrollment deadlines, and team schedules with the CRM's integrated calendar.`,
    content: `The CRM calendar unifies all your time-sensitive commitments—client meetings, seminar events, enrollment deadlines, and team activities—into a single view. Instead of juggling a separate calendar app, everything lives inside the CRM where it is connected to your leads, contacts, and deals.

The calendar supports day, week, month, and agenda views. Drag and drop events to reschedule them, resize event blocks to change duration, and click any open time slot to quickly create a new event. Color coding helps you distinguish between event types at a glance: client appointments in blue, internal meetings in gray, seminars and community events in green, and critical deadlines (like AEP start and end dates) in red. You can customize these colors under Settings > Calendar > Categories.

Syncing with external calendars is essential for avoiding double-bookings. Connect your Google Workspace or Microsoft 365 account under Settings > Calendar > Integrations, and events flow bidirectionally. A doctor's appointment you add in Google Calendar will block that time in the CRM, and a client meeting you schedule in the CRM will appear on your phone's calendar app. The sync runs every few minutes, so changes propagate quickly.

For team leads and managers, the calendar offers a team view that overlays multiple agents' schedules. This is invaluable when coordinating seminar staffing, assigning walk-in appointments, or ensuring adequate coverage during peak enrollment hours. Click on any agent's name to toggle their events on or off. You can also view a shared "enrollment deadlines" calendar that automatically populates key dates—AEP start/end, OEP start/end, Medicare Part D deadlines—so no one on the team misses a critical window.`,
    tags: [
      'calendar',
      'scheduling',
      'appointments',
      'sync',
      'Google Calendar',
      'Outlook',
      'team-view',
      'AEP',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'tc-scheduling-meetings',
    module: 'tasks-calendar',
    title: 'Scheduling Meetings',
    summary:
      'Use booking links, availability management, and automated reminders to schedule client meetings effortlessly.',
    content: `Scheduling meetings with prospects and clients is one of the most frequent activities in a Medicare agent's day. The CRM streamlines this process with booking links, smart availability detection, and automated confirmation and reminder emails—eliminating the back-and-forth that wastes time and delays enrollments.

To set up your booking page, go to Calendar > Booking Links and click "Create Booking Link." Define your available hours (e.g., Monday–Friday 9 AM–5 PM), meeting duration options (15, 30, or 60 minutes), and buffer time between meetings (typically 10–15 minutes to allow for note-taking and preparation). You can create multiple booking links for different purposes—one for initial consultations (30 minutes), another for enrollment appointments (60 minutes), and a short one for quick plan review calls (15 minutes).

Share your booking link anywhere: in email signatures, on your website, in social media bios, or directly in email and text messages to prospects. When a prospect clicks the link, they see a clean calendar interface showing only your available slots. They select a time, enter their name and contact information, and the meeting is confirmed instantly. The CRM creates a calendar event, links it to the contact's record, sends a confirmation email with the meeting details, and schedules a reminder (e.g., 24 hours and 1 hour before the meeting).

For meetings that involve multiple team members—such as a complex case requiring both an agent and a supervisor—use the "Round Robin" or "Collective" booking modes. Round Robin distributes meetings across available agents, balancing workload automatically. Collective booking finds a time when all required participants are free. Both modes respect each person's connected calendar availability. After the meeting, the CRM can automatically create a follow-up task prompting you to send a recap email or submit the enrollment application, ensuring nothing falls through the cracks after the conversation ends.`,
    tags: [
      'meetings',
      'scheduling',
      'booking-link',
      'availability',
      'reminders',
      'round-robin',
      'enrollment',
    ],
    difficulty: 'beginner',
  },
];
