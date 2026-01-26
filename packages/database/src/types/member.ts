// ============================================================================
// Member Types - Member portal related types
// ============================================================================

export interface Member {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  ssn_last_four?: string;
  address?: MemberAddress;
  enrollment_status: EnrollmentStatus;
  plan_id?: string;
  effective_date?: string;
  termination_date?: string;
  created_at: string;
  updated_at: string;
}

export interface MemberAddress {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
}

export type EnrollmentStatus =
  | 'pending'
  | 'active'
  | 'cancelled'
  | 'terminated'
  | 'suspended';

export interface MemberDependent {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  relationship: DependentRelationship;
  date_of_birth: string;
  ssn_last_four?: string;
  created_at: string;
  updated_at: string;
}

export type DependentRelationship =
  | 'spouse'
  | 'domestic_partner'
  | 'child'
  | 'stepchild'
  | 'foster_child'
  | 'other';

export interface MemberDocument {
  id: string;
  member_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface MemberNote {
  id: string;
  member_id: string;
  note_type: 'general' | 'enrollment' | 'support' | 'compliance';
  content: string;
  is_internal: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MemberActivity {
  id: string;
  member_id: string;
  activity_type: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}
