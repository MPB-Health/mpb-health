// Zoho CRM lead format
export interface ZohoLead {
  First_Name: string;
  Last_Name: string;
  Email: string;
  Phone: string;
  Company?: string;
  Lead_Source: string;
  Lead_Status?: string;
  Description?: string;
  Street?: string;
  City?: string;
  State?: string;
  Zip_Code?: string;
  Country?: string;
  Industry?: string;
  Annual_Revenue?: string;
  No_of_Employees?: string;
  Website?: string;
  Household_Size?: string;
  Current_Insurance?: string;
  Monthly_Premium?: string;
  Coverage_Preference?: string;
  Primary_Concern?: string;
  Contact_Preference?: string;
  Submitted_From?: string;
}

// Zoho sync result
export interface ZohoSyncResult {
  success: boolean;
  leadId?: string;
  zohoLeadId?: string;
  error?: string;
}

// Bulk sync result
export interface ZohoBulkSyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ leadId: string; error: string }>;
}

// Zoho sync statistics
export interface ZohoSyncStats {
  pending: number;
  failed: number;
  synced: number;
}

// Pipeline stage to Zoho status mapping
export const STAGE_TO_ZOHO_STATUS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Contact in Future',
  negotiation: 'Attempted to Contact',
  won: 'Converted',
  lost: 'Not Qualified',
};
