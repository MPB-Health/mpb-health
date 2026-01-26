export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  stageId: string;
  assignedTo?: string;
  leadScore: number;
  source?: string;
  sourceDetail?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  zohoId?: string;
  zohoSyncStatus: 'pending' | 'synced' | 'failed' | 'error';
  zohoLastSyncAt?: Date;
  customFields?: Record<string, unknown>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadFilters {
  search?: string;
  stageId?: string;
  assignedTo?: string;
  priority?: string;
  source?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PipelineStage {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  color: string;
  autoActions?: Record<string, unknown>[];
  isActive: boolean;
  createdAt: Date;
}

export interface LeadCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  sourceDetail?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
}

export interface LeadUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  stageId?: string;
  assignedTo?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
}
