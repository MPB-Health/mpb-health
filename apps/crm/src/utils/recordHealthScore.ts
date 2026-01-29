// ============================================================================
// Record Health Score System
// Calculates health scores (0-100) for CRM records based on data quality
// ============================================================================

// ============================================================================
// Types
// ============================================================================

export interface HealthScoreResult {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  color: 'green' | 'lime' | 'yellow' | 'orange' | 'red';
  factors: HealthScoreFactor[];
  suggestions: string[];
}

export interface HealthScoreFactor {
  id: string;
  label: string;
  weight: number;
  score: number; // 0-100 for this factor
  status: 'good' | 'warning' | 'critical';
  detail?: string;
}

// ============================================================================
// Lead Health Score
// ============================================================================

export interface LeadRecord {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source?: string | null;
  stage?: string | null;
  assigned_to?: string | null;
  last_activity_at?: string | null;
  created_at?: string | null;
  notes_count?: number;
  tasks_count?: number;
}

export function calculateLeadHealthScore(lead: LeadRecord): HealthScoreResult {
  const factors: HealthScoreFactor[] = [];
  const suggestions: string[] = [];

  // Factor 1: Contact Information Completeness (30%)
  let contactScore = 0;
  let contactDetail = '';
  if (lead.email) contactScore += 40;
  if (lead.phone) contactScore += 30;
  if (lead.first_name && lead.last_name) contactScore += 30;
  
  if (!lead.email) {
    suggestions.push('Add email address for better outreach');
    contactDetail = 'Missing email';
  }
  if (!lead.phone) {
    suggestions.push('Add phone number');
    if (contactDetail) contactDetail += ', phone';
    else contactDetail = 'Missing phone';
  }

  factors.push({
    id: 'contact-info',
    label: 'Contact Information',
    weight: 30,
    score: contactScore,
    status: contactScore >= 70 ? 'good' : contactScore >= 40 ? 'warning' : 'critical',
    detail: contactDetail || 'Complete',
  });

  // Factor 2: Lead Details (20%)
  let detailsScore = 0;
  if (lead.company) detailsScore += 40;
  if (lead.source) detailsScore += 30;
  if (lead.stage) detailsScore += 30;

  if (!lead.company) suggestions.push('Add company name');
  if (!lead.source) suggestions.push('Specify lead source for attribution');

  factors.push({
    id: 'details',
    label: 'Lead Details',
    weight: 20,
    score: detailsScore,
    status: detailsScore >= 70 ? 'good' : detailsScore >= 40 ? 'warning' : 'critical',
  });

  // Factor 3: Assignment (15%)
  const assignmentScore = lead.assigned_to ? 100 : 0;
  if (!lead.assigned_to) suggestions.push('Assign lead to a team member');

  factors.push({
    id: 'assignment',
    label: 'Assignment',
    weight: 15,
    score: assignmentScore,
    status: assignmentScore === 100 ? 'good' : 'critical',
    detail: lead.assigned_to ? 'Assigned' : 'Unassigned',
  });

  // Factor 4: Activity Recency (25%)
  let activityScore = 0;
  let activityDetail = '';
  if (lead.last_activity_at) {
    const daysSinceActivity = getDaysSince(lead.last_activity_at);
    if (daysSinceActivity <= 3) {
      activityScore = 100;
      activityDetail = 'Recent activity';
    } else if (daysSinceActivity <= 7) {
      activityScore = 80;
      activityDetail = `${daysSinceActivity} days ago`;
    } else if (daysSinceActivity <= 14) {
      activityScore = 50;
      activityDetail = `${daysSinceActivity} days ago`;
      suggestions.push('Follow up soon - no activity in 2 weeks');
    } else if (daysSinceActivity <= 30) {
      activityScore = 25;
      activityDetail = `${daysSinceActivity} days ago`;
      suggestions.push('Lead is going stale - immediate follow-up needed');
    } else {
      activityScore = 0;
      activityDetail = `${daysSinceActivity} days ago`;
      suggestions.push('Critical: Lead has been inactive for over a month');
    }
  } else {
    activityDetail = 'No activity recorded';
    suggestions.push('Log first activity on this lead');
  }

  factors.push({
    id: 'activity',
    label: 'Activity Recency',
    weight: 25,
    score: activityScore,
    status: activityScore >= 70 ? 'good' : activityScore >= 40 ? 'warning' : 'critical',
    detail: activityDetail,
  });

  // Factor 5: Engagement (10%)
  let engagementScore = 0;
  const notesCount = lead.notes_count || 0;
  const tasksCount = lead.tasks_count || 0;
  if (notesCount > 0) engagementScore += 50;
  if (tasksCount > 0) engagementScore += 50;

  if (notesCount === 0 && tasksCount === 0) {
    suggestions.push('Add notes or create tasks to track engagement');
  }

  factors.push({
    id: 'engagement',
    label: 'Engagement',
    weight: 10,
    score: engagementScore,
    status: engagementScore >= 50 ? 'good' : 'warning',
    detail: `${notesCount} notes, ${tasksCount} tasks`,
  });

  // Calculate weighted score
  const totalScore = factors.reduce((sum, f) => sum + (f.score * f.weight / 100), 0);

  return {
    score: Math.round(totalScore),
    grade: getGrade(totalScore),
    color: getColor(totalScore),
    factors,
    suggestions: suggestions.slice(0, 3), // Top 3 suggestions
  };
}

// ============================================================================
// Deal Health Score
// ============================================================================

export interface DealRecord {
  id: string;
  name?: string | null;
  value?: number | null;
  stage?: string | null;
  probability?: number | null;
  expected_close_date?: string | null;
  account_id?: string | null;
  contact_id?: string | null;
  assigned_to?: string | null;
  last_activity_at?: string | null;
  created_at?: string | null;
  next_step?: string | null;
  loss_reason?: string | null;
}

export function calculateDealHealthScore(deal: DealRecord): HealthScoreResult {
  const factors: HealthScoreFactor[] = [];
  const suggestions: string[] = [];

  // Factor 1: Deal Information (20%)
  let infoScore = 0;
  if (deal.name) infoScore += 25;
  if (deal.value && deal.value > 0) infoScore += 35;
  if (deal.expected_close_date) infoScore += 25;
  if (deal.probability !== undefined && deal.probability !== null) infoScore += 15;

  if (!deal.value) suggestions.push('Add deal value for accurate forecasting');
  if (!deal.expected_close_date) suggestions.push('Set expected close date');

  factors.push({
    id: 'deal-info',
    label: 'Deal Information',
    weight: 20,
    score: infoScore,
    status: infoScore >= 75 ? 'good' : infoScore >= 50 ? 'warning' : 'critical',
  });

  // Factor 2: Relationships (20%)
  let relationshipScore = 0;
  if (deal.account_id) relationshipScore += 50;
  if (deal.contact_id) relationshipScore += 50;

  if (!deal.account_id) suggestions.push('Link deal to an account');
  if (!deal.contact_id) suggestions.push('Add primary contact for this deal');

  factors.push({
    id: 'relationships',
    label: 'Account & Contact',
    weight: 20,
    score: relationshipScore,
    status: relationshipScore === 100 ? 'good' : relationshipScore >= 50 ? 'warning' : 'critical',
  });

  // Factor 3: Next Step Defined (20%)
  const nextStepScore = deal.next_step ? 100 : 0;
  if (!deal.next_step) suggestions.push('Define next step to move deal forward');

  factors.push({
    id: 'next-step',
    label: 'Next Step Defined',
    weight: 20,
    score: nextStepScore,
    status: nextStepScore === 100 ? 'good' : 'critical',
    detail: deal.next_step ? 'Defined' : 'Missing',
  });

  // Factor 4: Activity Recency (25%)
  let activityScore = 0;
  let activityDetail = '';
  if (deal.last_activity_at) {
    const daysSinceActivity = getDaysSince(deal.last_activity_at);
    if (daysSinceActivity <= 5) {
      activityScore = 100;
      activityDetail = 'Active';
    } else if (daysSinceActivity <= 10) {
      activityScore = 70;
      activityDetail = `${daysSinceActivity} days ago`;
    } else if (daysSinceActivity <= 21) {
      activityScore = 40;
      activityDetail = `${daysSinceActivity} days ago`;
      suggestions.push('Deal needs attention - follow up required');
    } else {
      activityScore = 10;
      activityDetail = `${daysSinceActivity} days stale`;
      suggestions.push('Critical: Deal is stale and at risk');
    }
  } else {
    activityDetail = 'No activity';
    suggestions.push('Log first activity on this deal');
  }

  factors.push({
    id: 'activity',
    label: 'Activity Recency',
    weight: 25,
    score: activityScore,
    status: activityScore >= 70 ? 'good' : activityScore >= 40 ? 'warning' : 'critical',
    detail: activityDetail,
  });

  // Factor 5: Close Date Health (15%)
  let closeDateScore = 100;
  let closeDateDetail = 'On track';
  if (deal.expected_close_date) {
    const daysToClose = getDaysUntil(deal.expected_close_date);
    if (daysToClose < 0) {
      closeDateScore = 0;
      closeDateDetail = 'Past due';
      suggestions.push('Update expected close date - current date has passed');
    } else if (daysToClose <= 7) {
      closeDateScore = 60;
      closeDateDetail = 'Closing soon';
    }
  } else {
    closeDateScore = 50;
    closeDateDetail = 'Not set';
  }

  factors.push({
    id: 'close-date',
    label: 'Close Date Health',
    weight: 15,
    score: closeDateScore,
    status: closeDateScore >= 60 ? 'good' : closeDateScore >= 30 ? 'warning' : 'critical',
    detail: closeDateDetail,
  });

  // Calculate weighted score
  const totalScore = factors.reduce((sum, f) => sum + (f.score * f.weight / 100), 0);

  return {
    score: Math.round(totalScore),
    grade: getGrade(totalScore),
    color: getColor(totalScore),
    factors,
    suggestions: suggestions.slice(0, 3),
  };
}

// ============================================================================
// Contact Health Score
// ============================================================================

export interface ContactRecord {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  account_id?: string | null;
  last_activity_at?: string | null;
  created_at?: string | null;
  notes_count?: number;
  deals_count?: number;
}

export function calculateContactHealthScore(contact: ContactRecord): HealthScoreResult {
  const factors: HealthScoreFactor[] = [];
  const suggestions: string[] = [];

  // Factor 1: Contact Details (40%)
  let detailsScore = 0;
  if (contact.first_name && contact.last_name) detailsScore += 25;
  if (contact.email) detailsScore += 35;
  if (contact.phone) detailsScore += 25;
  if (contact.title) detailsScore += 15;

  if (!contact.email) suggestions.push('Add email address');
  if (!contact.phone) suggestions.push('Add phone number');

  factors.push({
    id: 'details',
    label: 'Contact Details',
    weight: 40,
    score: detailsScore,
    status: detailsScore >= 75 ? 'good' : detailsScore >= 50 ? 'warning' : 'critical',
  });

  // Factor 2: Account Link (20%)
  const accountScore = contact.account_id ? 100 : 0;
  if (!contact.account_id) suggestions.push('Link contact to an account');

  factors.push({
    id: 'account',
    label: 'Account Link',
    weight: 20,
    score: accountScore,
    status: accountScore === 100 ? 'good' : 'warning',
  });

  // Factor 3: Activity (25%)
  let activityScore = 0;
  if (contact.last_activity_at) {
    const daysSinceActivity = getDaysSince(contact.last_activity_at);
    if (daysSinceActivity <= 30) activityScore = 100;
    else if (daysSinceActivity <= 60) activityScore = 70;
    else if (daysSinceActivity <= 90) activityScore = 40;
    else {
      activityScore = 20;
      suggestions.push('Re-engage this contact - inactive for 90+ days');
    }
  } else {
    suggestions.push('Log first activity with this contact');
  }

  factors.push({
    id: 'activity',
    label: 'Activity',
    weight: 25,
    score: activityScore,
    status: activityScore >= 70 ? 'good' : activityScore >= 40 ? 'warning' : 'critical',
  });

  // Factor 4: Engagement (15%)
  let engagementScore = 0;
  const notesCount = contact.notes_count || 0;
  const dealsCount = contact.deals_count || 0;
  if (notesCount > 0) engagementScore += 50;
  if (dealsCount > 0) engagementScore += 50;

  factors.push({
    id: 'engagement',
    label: 'Engagement',
    weight: 15,
    score: engagementScore,
    status: engagementScore >= 50 ? 'good' : 'warning',
    detail: `${dealsCount} deals, ${notesCount} notes`,
  });

  const totalScore = factors.reduce((sum, f) => sum + (f.score * f.weight / 100), 0);

  return {
    score: Math.round(totalScore),
    grade: getGrade(totalScore),
    color: getColor(totalScore),
    factors,
    suggestions: suggestions.slice(0, 3),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getDaysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysUntil(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getColor(score: number): 'green' | 'lime' | 'yellow' | 'orange' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 60) return 'lime';
  if (score >= 40) return 'yellow';
  if (score >= 20) return 'orange';
  return 'red';
}
