export interface Contact {
  id: string;
  org_id: string;
  account_id: string | null;
  salutation: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  fax: string | null;
  title: string | null;
  department: string | null;
  reports_to: string | null;
  mailing_address: Record<string, string>;
  other_address: Record<string, string>;
  lead_source: string | null;
  converted_from_lead_id: string | null;
  converted_at: string | null;
  do_not_call: boolean;
  do_not_email: boolean;
  email_opt_out: boolean;
  owner_id: string | null;
  tags: string[];
  description: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  date_of_birth: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Domain fields
  plan_type: 'healthshare' | 'traditional_insurance' | null;
  carrier_id: string | null;
  original_effective_date: string | null;
  premium_amount: number | null;
  subsidy_amount: number | null;
  member_responsibility: number | null;
  tobacco_status: string | null;
  state: string | null;
  city: string | null;
}

export interface ContactWithRelations extends Contact {
  account?: {
    id: string;
    name: string;
  } | null;
  owner?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  reports_to_contact?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  carrier?: {
    id: string;
    name: string;
    carrier_type: string;
  } | null;
}

export interface ContactFilters {
  search?: string;
  account_id?: string;
  owner_id?: string;
  lead_source?: string;
  tags?: string[];
  do_not_call?: boolean;
  do_not_email?: boolean;
  dateFrom?: string;
  dateTo?: string;
  planType?: 'healthshare' | 'traditional_insurance';
  carrierId?: string;
  tobaccoStatus?: string;
  state?: string;
}

export interface ContactCreateInput {
  account_id?: string;
  salutation?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  title?: string;
  department?: string;
  reports_to?: string;
  mailing_address?: Record<string, string>;
  other_address?: Record<string, string>;
  lead_source?: string;
  do_not_call?: boolean;
  do_not_email?: boolean;
  email_opt_out?: boolean;
  owner_id?: string;
  tags?: string[];
  description?: string;
  linkedin_url?: string;
  twitter_handle?: string;
  date_of_birth?: string;
  plan_type?: 'healthshare' | 'traditional_insurance';
  carrier_id?: string;
  original_effective_date?: string;
  premium_amount?: number;
  subsidy_amount?: number;
  member_responsibility?: number;
  tobacco_status?: string;
  state?: string;
  city?: string;
}

export interface ContactUpdateInput extends Partial<ContactCreateInput> {}

export interface ConvertLeadInput {
  leadId: string;
  accountId?: string;
  createAccount?: boolean;
  accountName?: string;
}
