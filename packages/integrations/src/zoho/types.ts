export interface ZohoLead {
  id?: string;
  First_Name: string;
  Last_Name: string;
  Email: string;
  Phone?: string;
  Company?: string;
  Lead_Source?: string;
  Lead_Status?: string;
  Description?: string;
  Zip_Code?: string;
  Household_Size?: string;
  Current_Insurance?: string;
  Monthly_Premium?: string;
  Coverage_Preference?: string;
  Primary_Concern?: string;
  Contact_Preference?: string;
  Submitted_From?: string;
}

export interface ZohoSyncConfig {
  direction: 'to_zoho' | 'from_zoho' | 'bidirectional';
  conflictResolution: 'local_wins' | 'zoho_wins' | 'latest_wins' | 'manual';
  syncFields: string[];
  syncIntervalMinutes: number;
  maxRetries: number;
  retryDelayMs: number;
}

export type ZohoSyncStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'conflict';

export interface ZohoFieldMapping {
  id: string;
  entityType: string;
  localField: string;
  zohoField: string;
  syncDirection: 'to_zoho' | 'from_zoho' | 'bidirectional';
  transformFunction?: string;
  isActive: boolean;
}

export interface ZohoSyncResult {
  success: boolean;
  zohoId?: string;
  error?: string;
  syncedAt: Date;
  attempts: number;
}

export interface ZohoSyncQueueItem {
  id: string;
  entityType: 'lead' | 'contact' | 'deal';
  localId: string;
  zohoId?: string;
  operation: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  status: ZohoSyncStatus;
  attempts: number;
  errorMessage?: string;
  createdAt: Date;
  processedAt?: Date;
}
