export type FamilyRelationship =
  | 'spouse'
  | 'child'
  | 'stepchild'
  | 'domestic_partner'
  | 'foster_child'
  | 'ward'
  | 'parent'
  | 'other';

export interface FamilyMember {
  id: string;
  org_id: string;
  lead_id: string | null;
  contact_id: string | null;
  first_name: string;
  last_name: string;
  relationship: FamilyRelationship;
  date_of_birth: string | null;
  gender: string | null;
  email: string | null;
  is_covered: boolean;
  coverage_start_date: string | null;
  coverage_end_date: string | null;
  ssn_last_four: string | null;
  tobacco_user: boolean;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  phone_numbers?: PhoneNumber[];
}

export interface FamilyMemberCreateInput {
  lead_id?: string;
  contact_id?: string;
  first_name: string;
  last_name: string;
  relationship: FamilyRelationship;
  date_of_birth?: string;
  gender?: string;
  email?: string;
  is_covered?: boolean;
  coverage_start_date?: string;
  coverage_end_date?: string;
  ssn_last_four?: string;
  tobacco_user?: boolean;
  notes?: string;
  sort_order?: number;
}

export interface FamilyMemberUpdateInput extends Partial<FamilyMemberCreateInput> {}

export interface PhoneNumber {
  id: string;
  org_id: string;
  owner_type: 'lead' | 'contact' | 'family_member';
  owner_id: string;
  phone_number: string;
  phone_type: PhoneType;
  is_primary: boolean;
  label: string | null;
  do_not_call: boolean;
  created_at: string;
}

export type PhoneType = 'mobile' | 'home' | 'work' | 'fax' | 'other';

export interface PhoneNumberCreateInput {
  owner_type: 'lead' | 'contact' | 'family_member';
  owner_id: string;
  phone_number: string;
  phone_type?: PhoneType;
  is_primary?: boolean;
  label?: string;
  do_not_call?: boolean;
}

export interface PhoneNumberUpdateInput {
  phone_number?: string;
  phone_type?: PhoneType;
  is_primary?: boolean;
  label?: string;
  do_not_call?: boolean;
}

export const RELATIONSHIP_LABELS: Record<FamilyRelationship, string> = {
  spouse: 'Spouse',
  child: 'Child',
  stepchild: 'Stepchild',
  domestic_partner: 'Domestic Partner',
  foster_child: 'Foster Child',
  ward: 'Ward',
  parent: 'Parent',
  other: 'Other',
};

export const PHONE_TYPE_LABELS: Record<PhoneType, string> = {
  mobile: 'Mobile',
  home: 'Home',
  work: 'Work',
  fax: 'Fax',
  other: 'Other',
};
