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

// ============================================================================
// Admin CRUD Functions
// ============================================================================

export interface AdminAdvisorFilters {
  search?: string;
  state?: string;
  agentType?: string;
  activeStatus?: 'all' | 'active' | 'inactive';
}

export interface AdvisorStats {
  total: number;
  active: number;
  inactive: number;
  statesCount: number;
}

export type AdvisorFormData = Omit<Advisor, 'id' | 'created_at' | 'updated_at'>;

export async function getAllAdvisors(filters?: AdminAdvisorFilters): Promise<Advisor[]> {
  try {
    let query = supabase
      .from('advisors')
      .select('*')
      .order('last_name', { ascending: true });

    if (filters?.activeStatus === 'active') {
      query = query.eq('is_active', true);
    } else if (filters?.activeStatus === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (filters?.state && filters.state !== 'all') {
      query = query.eq('state', filters.state);
    }

    if (filters?.agentType && filters.agentType !== 'all') {
      query = query.eq('agent_type', filters.agentType);
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      query = query.or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,agent_id.ilike.%${searchTerm}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('[advisorDirectoryService] Error fetching all advisors:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[advisorDirectoryService] Error in getAllAdvisors:', error);
    throw error;
  }
}

export async function createAdvisor(data: Partial<AdvisorFormData>): Promise<Advisor> {
  try {
    const { data: advisor, error } = await supabase
      .from('advisors')
      .insert({
        ...data,
        is_active: data.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('[advisorDirectoryService] Error creating advisor:', error);
      throw error;
    }

    return advisor;
  } catch (error) {
    console.error('[advisorDirectoryService] Error in createAdvisor:', error);
    throw error;
  }
}

export async function updateAdvisor(id: string, data: Partial<AdvisorFormData>): Promise<Advisor> {
  try {
    const { data: advisor, error } = await supabase
      .from('advisors')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[advisorDirectoryService] Error updating advisor:', error);
      throw error;
    }

    return advisor;
  } catch (error) {
    console.error('[advisorDirectoryService] Error in updateAdvisor:', error);
    throw error;
  }
}

export async function toggleAdvisorActive(id: string, isActive: boolean): Promise<void> {
  try {
    const { error } = await supabase
      .from('advisors')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      console.error('[advisorDirectoryService] Error toggling advisor active:', error);
      throw error;
    }
  } catch (error) {
    console.error('[advisorDirectoryService] Error in toggleAdvisorActive:', error);
    throw error;
  }
}

export async function deleteAdvisor(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('advisors')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[advisorDirectoryService] Error deleting advisor:', error);
      throw error;
    }
  } catch (error) {
    console.error('[advisorDirectoryService] Error in deleteAdvisor:', error);
    throw error;
  }
}

export async function getAdvisorStats(): Promise<AdvisorStats> {
  try {
    const [allResult, activeResult, statesResult] = await Promise.all([
      supabase.from('advisors').select('id', { count: 'exact', head: true }),
      supabase.from('advisors').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('advisors').select('state').eq('is_active', true).not('state', 'is', null),
    ]);

    const total = allResult.count || 0;
    const active = activeResult.count || 0;
    const statesCount = new Set(statesResult.data?.map(s => s.state).filter(Boolean) || []).size;

    return {
      total,
      active,
      inactive: total - active,
      statesCount,
    };
  } catch (error) {
    console.error('[advisorDirectoryService] Error in getAdvisorStats:', error);
    return { total: 0, active: 0, inactive: 0, statesCount: 0 };
  }
}

export async function getAllStates(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('advisors')
      .select('state')
      .not('state', 'is', null)
      .order('state');

    if (error) {
      console.error('[advisorDirectoryService] Error fetching all states:', error);
      return [];
    }

    return [...new Set(data?.map(item => item.state).filter(Boolean) || [])].sort();
  } catch (error) {
    console.error('[advisorDirectoryService] Error in getAllStates:', error);
    return [];
  }
}

export async function getAllAgentTypes(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('advisors')
      .select('agent_type')
      .not('agent_type', 'is', null)
      .order('agent_type');

    if (error) {
      console.error('[advisorDirectoryService] Error fetching all agent types:', error);
      return [];
    }

    return [...new Set(data?.map(item => item.agent_type).filter(Boolean) || [])].sort();
  } catch (error) {
    console.error('[advisorDirectoryService] Error in getAllAgentTypes:', error);
    return [];
  }
}
