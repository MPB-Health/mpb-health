import { supabase } from './supabase';

export interface Advisor {
  id: string;
  agent_id: string;
  parent_id?: string;
  parent_label?: string;
  agent_label?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  county?: string;
  phone_1?: string;
  phone_2?: string;
  email?: string;
  email_2?: string;
  website_link?: string;
  domain_name?: string;
  agent_type?: string;
  agent_type_2?: string;
  agent_type_3?: string;
  status?: string;
  license_states?: string;
  active_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdvisorFilters {
  search?: string;
  state?: string;
  agentType?: string;
}

export async function getAdvisors(filters?: AdvisorFilters): Promise<Advisor[]> {
  try {
    console.log('[advisorDirectoryService] Fetching advisors with filters:', filters);

    let query = supabase
      .from('advisors')
      .select('*')
      .eq('is_active', true)
      .order('last_name', { ascending: true });

    if (filters?.state && filters.state !== 'all') {
      query = query.eq('state', filters.state);
    }

    if (filters?.agentType && filters.agentType !== 'all') {
      query = query.eq('agent_type', filters.agentType);
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      query = query.or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('[advisorDirectoryService] Error fetching advisors:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      if (error.code === 'PGRST301' || error.message.includes('JWT')) {
        console.error('[advisorDirectoryService] Authentication error - check RLS policies');
      }

      return [];
    }

    console.log('[advisorDirectoryService] Fetched advisors:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('[advisorDirectoryService] Error in getAdvisors:', error);
    return [];
  }
}

export async function getUniqueStates(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('advisors')
      .select('state')
      .eq('is_active', true)
      .not('state', 'is', null)
      .order('state');

    if (error) {
      console.error('[advisorDirectoryService] Error fetching states:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      return [];
    }

    const uniqueStates = [...new Set(data?.map(item => item.state).filter(Boolean) || [])];
    return uniqueStates.sort();
  } catch (error) {
    console.error('[advisorDirectoryService] Error in getUniqueStates:', error);
    return [];
  }
}

export async function getUniqueAgentTypes(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('advisors')
      .select('agent_type')
      .eq('is_active', true)
      .not('agent_type', 'is', null)
      .order('agent_type');

    if (error) {
      console.error('[advisorDirectoryService] Error fetching agent types:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      return [];
    }

    const uniqueTypes = [...new Set(data?.map(item => item.agent_type).filter(Boolean) || [])];
    return uniqueTypes.sort();
  } catch (error) {
    console.error('[advisorDirectoryService] Error in getUniqueAgentTypes:', error);
    return [];
  }
}

export function formatPhoneNumber(phone?: string): string {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}

export function getAdvisorDisplayName(advisor: Advisor): string {
  if (advisor.first_name || advisor.last_name) {
    return `${advisor.first_name || ''} ${advisor.last_name || ''}`.trim();
  }

  if (advisor.agent_label) {
    return advisor.agent_label;
  }

  return advisor.company || 'Advisor';
}

export function getAdvisorFullAddress(advisor: Advisor): string {
  const parts: string[] = [];

  if (advisor.address_1) parts.push(advisor.address_1);
  if (advisor.address_2) parts.push(advisor.address_2);

  const cityStateZip: string[] = [];
  if (advisor.city) cityStateZip.push(advisor.city);
  if (advisor.state) cityStateZip.push(advisor.state);
  if (advisor.zipcode) cityStateZip.push(advisor.zipcode);

  if (cityStateZip.length > 0) {
    parts.push(cityStateZip.join(', '));
  }

  return parts.join(', ');
}
