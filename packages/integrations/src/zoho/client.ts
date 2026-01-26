import type { ZohoLead } from './types';

// Zoho CRM API Client
export const zohoClient = {
  // OAuth
  getAccessToken: async (): Promise<string | null> => null,
  refreshToken: async (): Promise<string | null> => null,

  // Leads
  createLead: async (_lead: Partial<ZohoLead>): Promise<string | null> => null,
  updateLead: async (_id: string, _data: Partial<ZohoLead>): Promise<boolean> => false,
  getLead: async (_id: string): Promise<ZohoLead | null> => null,
  getLeads: async (_params?: Record<string, unknown>): Promise<ZohoLead[]> => [],
  deleteLead: async (_id: string): Promise<boolean> => false,

  // Contacts
  createContact: async (_contact: Record<string, unknown>): Promise<string | null> => null,
  getContacts: async (_params?: Record<string, unknown>): Promise<unknown[]> => [],

  // Deals
  createDeal: async (_deal: Record<string, unknown>): Promise<string | null> => null,
  getDeals: async (_params?: Record<string, unknown>): Promise<unknown[]> => [],

  // Generic API call
  apiCall: async (_module: string, _method: string, _data?: unknown): Promise<unknown> => null,
};
