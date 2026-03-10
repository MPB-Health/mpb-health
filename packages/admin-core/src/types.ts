// User Types
export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff';
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
  avatar_url: string | null;
  last_login_at: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  created_at: string;
}

export interface Permission {
  id: string;
  key: string;
  module: string;
  description: string | null;
}

// Enrollment Types
export interface Enrollment {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  application_type: 'advisor' | 'member' | 'partner';
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'on_hold';
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  documents: EnrollmentDocument[];
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  status: 'pending' | 'verified' | 'rejected';
  verified_at: string | null;
  verified_by: string | null;
}

// Content Types
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  author_id: string;
  author_name: string | null;
  status: 'draft' | 'published' | 'archived';
  category: string;
  tags: string[];
  published_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_type: string;
  file_size: number;
  is_public: boolean;
  download_count: number;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// System Settings Types
export interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  category: string;
  description: string | null;
  is_sensitive: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface Integration {
  id: string;
  name: string;
  type: 'zoho' | 'mailchimp' | 'stripe' | 'twilio' | 'cognito' | 'other';
  status: 'active' | 'inactive' | 'error';
  config: Record<string, unknown>;
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Analytics Types
export interface DashboardMetrics {
  total_users: number;
  active_users: number;
  total_advisors: number;
  active_advisors: number;
  pending_enrollments: number;
  total_leads: number;
  conversion_rate: number;
  new_leads_today: number;
  new_leads_this_week: number;
  new_leads_this_month: number;
}

export interface ActivityMetric {
  date: string;
  value: number;
}

export interface TopPerformer {
  id: string;
  name: string;
  metric: number;
  change: number;
}
