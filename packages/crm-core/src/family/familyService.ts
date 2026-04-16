import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  FamilyMember,
  FamilyMemberCreateInput,
  FamilyMemberUpdateInput,
  PhoneNumber,
  PhoneNumberCreateInput,
  PhoneNumberUpdateInput,
} from './familyTypes';

export class FamilyService {
  constructor(private supabase: SupabaseClient) {}

  // ── Family Members ───────────────────────────────────────────────

  async getFamilyMembers(parentType: 'lead' | 'contact', parentId: string): Promise<FamilyMember[]> {
    try {
      const column = parentType === 'lead' ? 'lead_id' : 'contact_id';
      const { data, error } = await this.supabase
        .from('crm_family_members')
        .select('id, org_id, lead_id, contact_id, first_name, last_name, relationship, date_of_birth, gender, email, is_covered, coverage_start_date, coverage_end_date, ssn_last_four, tobacco_user, notes, sort_order, created_at, updated_at')
        .eq(column, parentId)
        .order('sort_order', { ascending: true })
        .order('relationship', { ascending: true });

      if (error) {
        console.error('Failed to get family members:', error);
        return [];
      }

      const members = data as unknown as FamilyMember[];

      if (members.length > 0) {
        const memberIds = members.map((m) => m.id);
        const { data: phones } = await this.supabase
          .from('crm_phone_numbers')
          .select('id, org_id, owner_type, owner_id, phone_number, phone_type, is_primary, label, do_not_call, created_at')
          .eq('owner_type', 'family_member')
          .in('owner_id', memberIds);

        if (phones) {
          const phoneMap = new Map<string, PhoneNumber[]>();
          for (const p of phones as unknown as PhoneNumber[]) {
            const existing = phoneMap.get(p.owner_id) || [];
            existing.push(p);
            phoneMap.set(p.owner_id, existing);
          }
          for (const member of members) {
            member.phone_numbers = phoneMap.get(member.id) || [];
          }
        }
      }

      return members;
    } catch (error) {
      console.error('Get family members error:', error);
      return [];
    }
  }

  async createFamilyMember(
    input: FamilyMemberCreateInput
  ): Promise<{ success: boolean; member?: FamilyMember; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('crm_family_members')
        .insert({
          lead_id: input.lead_id || null,
          contact_id: input.contact_id || null,
          first_name: input.first_name,
          last_name: input.last_name,
          relationship: input.relationship,
          date_of_birth: input.date_of_birth || null,
          gender: input.gender || null,
          email: input.email || null,
          is_covered: input.is_covered ?? false,
          coverage_start_date: input.coverage_start_date || null,
          coverage_end_date: input.coverage_end_date || null,
          ssn_last_four: input.ssn_last_four || null,
          tobacco_user: input.tobacco_user ?? false,
          notes: input.notes || null,
          sort_order: input.sort_order ?? 0,
        })
        .select('id, org_id, lead_id, contact_id, first_name, last_name, relationship, date_of_birth, gender, email, is_covered, coverage_start_date, coverage_end_date, ssn_last_four, tobacco_user, notes, sort_order, created_at, updated_at')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, member: data as unknown as FamilyMember };
    } catch (error) {
      console.error('Create family member error:', error);
      return { success: false, error: 'Failed to create family member' };
    }
  }

  async updateFamilyMember(
    id: string,
    updates: FamilyMemberUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_family_members')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Update family member error:', error);
      return { success: false, error: 'Failed to update family member' };
    }
  }

  async deleteFamilyMember(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.supabase
        .from('crm_phone_numbers')
        .delete()
        .eq('owner_type', 'family_member')
        .eq('owner_id', id);

      const { error } = await this.supabase
        .from('crm_family_members')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Delete family member error:', error);
      return { success: false, error: 'Failed to delete family member' };
    }
  }

  // ── Phone Numbers ────────────────────────────────────────────────

  async getPhoneNumbers(ownerType: string, ownerId: string): Promise<PhoneNumber[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_phone_numbers')
        .select('id, org_id, owner_type, owner_id, phone_number, phone_type, is_primary, label, do_not_call, created_at')
        .eq('owner_type', ownerType)
        .eq('owner_id', ownerId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to get phone numbers:', error);
        return [];
      }

      return data as unknown as PhoneNumber[];
    } catch (error) {
      console.error('Get phone numbers error:', error);
      return [];
    }
  }

  async addPhoneNumber(
    input: PhoneNumberCreateInput
  ): Promise<{ success: boolean; phone?: PhoneNumber; error?: string }> {
    try {
      if (input.is_primary) {
        await this.supabase
          .from('crm_phone_numbers')
          .update({ is_primary: false })
          .eq('owner_type', input.owner_type)
          .eq('owner_id', input.owner_id)
          .eq('is_primary', true);
      }

      const { data, error } = await this.supabase
        .from('crm_phone_numbers')
        .insert({
          owner_type: input.owner_type,
          owner_id: input.owner_id,
          phone_number: input.phone_number,
          phone_type: input.phone_type || 'mobile',
          is_primary: input.is_primary ?? false,
          label: input.label || null,
          do_not_call: input.do_not_call ?? false,
        })
        .select('id, org_id, owner_type, owner_id, phone_number, phone_type, is_primary, label, do_not_call, created_at')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, phone: data as unknown as PhoneNumber };
    } catch (error) {
      console.error('Add phone number error:', error);
      return { success: false, error: 'Failed to add phone number' };
    }
  }

  async updatePhoneNumber(
    id: string,
    updates: PhoneNumberUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (updates.is_primary) {
        const { data: phone } = await this.supabase
          .from('crm_phone_numbers')
          .select('owner_type, owner_id')
          .eq('id', id)
          .single();

        if (phone) {
          await this.supabase
            .from('crm_phone_numbers')
            .update({ is_primary: false })
            .eq('owner_type', phone.owner_type)
            .eq('owner_id', phone.owner_id)
            .eq('is_primary', true);
        }
      }

      const { error } = await this.supabase
        .from('crm_phone_numbers')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Update phone number error:', error);
      return { success: false, error: 'Failed to update phone number' };
    }
  }

  async deletePhoneNumber(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_phone_numbers')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Delete phone number error:', error);
      return { success: false, error: 'Failed to delete phone number' };
    }
  }
}

export function createFamilyService(supabase: SupabaseClient): FamilyService {
  return new FamilyService(supabase);
}
