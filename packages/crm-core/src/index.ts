// Lead Management
export { leadService } from './leads/leadService';
export { pipelineService } from './leads/pipelineService';
export type { Lead, LeadFilters, PipelineStage } from './leads/leadTypes';

// Activities
export { activityService } from './activities/activityService';
export type { Activity, ActivityType } from './activities/types';

// Tasks
export { taskService } from './tasks/taskService';
export type { Task, TaskStatus, TaskPriority } from './tasks/types';

// Automation
export { automationService } from './automation/automationService';
export type { AutomationRule, AutomationTrigger, AutomationAction } from './automation/types';

// AI Insights
export { insightsService } from './insights/insightsService';
export type { LeadInsight, InsightType } from './insights/types';

// Templates
export { templateService } from './templates/templateService';
export type { CommunicationTemplate, TemplateType } from './templates/types';
