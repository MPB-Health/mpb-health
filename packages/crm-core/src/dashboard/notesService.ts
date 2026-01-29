import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  DashboardNote,
  NoteCreateInput,
  NoteUpdateInput,
  ServiceResult,
} from './types';

// ============================================================================
// Dashboard Notes Service
// Quick notes for the Notes widget
// ============================================================================

export class DashboardNotesService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all notes for the current user in an organization
   */
  async getNotes(orgId: string, options?: {
    pinnedOnly?: boolean;
    limit?: number;
    linkedEntityType?: string;
    linkedEntityId?: string;
  }): Promise<DashboardNote[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return [];

      let query = this.supabase
        .from('crm_dashboard_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('org_id', orgId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (options?.pinnedOnly) {
        query = query.eq('is_pinned', true);
      }

      if (options?.linkedEntityType && options?.linkedEntityId) {
        query = query
          .eq('linked_entity_type', options.linkedEntityType)
          .eq('linked_entity_id', options.linkedEntityId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get notes:', error);
        return [];
      }

      return (data || []) as DashboardNote[];
    } catch (error) {
      console.error('Get notes error:', error);
      return [];
    }
  }

  /**
   * Get pinned notes only
   */
  async getPinnedNotes(orgId: string): Promise<DashboardNote[]> {
    return this.getNotes(orgId, { pinnedOnly: true });
  }

  /**
   * Get recent notes
   */
  async getRecentNotes(orgId: string, limit: number = 10): Promise<DashboardNote[]> {
    return this.getNotes(orgId, { limit });
  }

  /**
   * Get a single note by ID
   */
  async getNote(noteId: string): Promise<DashboardNote | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_dashboard_notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) {
        console.error('Failed to get note:', error);
        return null;
      }

      return data as DashboardNote;
    } catch (error) {
      console.error('Get note error:', error);
      return null;
    }
  }

  /**
   * Create a new note
   */
  async createNote(
    orgId: string,
    input: NoteCreateInput
  ): Promise<ServiceResult<DashboardNote>> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('crm_dashboard_notes')
        .insert({
          user_id: user.id,
          org_id: orgId,
          title: input.title,
          content: input.content,
          is_pinned: input.is_pinned || false,
          color: input.color || 'default',
          linked_entity_type: input.linked_entity_type,
          linked_entity_id: input.linked_entity_id,
          tags: input.tags || [],
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as DashboardNote };
    } catch (error) {
      console.error('Create note error:', error);
      return { success: false, error: 'Failed to create note' };
    }
  }

  /**
   * Update a note
   */
  async updateNote(
    noteId: string,
    input: NoteUpdateInput
  ): Promise<ServiceResult<DashboardNote>> {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.is_pinned !== undefined) updateData.is_pinned = input.is_pinned;
      if (input.color !== undefined) updateData.color = input.color;
      if (input.linked_entity_type !== undefined) updateData.linked_entity_type = input.linked_entity_type;
      if (input.linked_entity_id !== undefined) updateData.linked_entity_id = input.linked_entity_id;
      if (input.tags !== undefined) updateData.tags = input.tags;

      const { data, error } = await this.supabase
        .from('crm_dashboard_notes')
        .update(updateData)
        .eq('id', noteId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as DashboardNote };
    } catch (error) {
      console.error('Update note error:', error);
      return { success: false, error: 'Failed to update note' };
    }
  }

  /**
   * Toggle pin status of a note
   */
  async togglePin(noteId: string): Promise<ServiceResult<DashboardNote>> {
    try {
      // First get current pin status
      const { data: current } = await this.supabase
        .from('crm_dashboard_notes')
        .select('is_pinned')
        .eq('id', noteId)
        .single();

      if (!current) {
        return { success: false, error: 'Note not found' };
      }

      return this.updateNote(noteId, { is_pinned: !current.is_pinned });
    } catch (error) {
      console.error('Toggle pin error:', error);
      return { success: false, error: 'Failed to toggle pin' };
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<ServiceResult> {
    try {
      const { error } = await this.supabase
        .from('crm_dashboard_notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete note error:', error);
      return { success: false, error: 'Failed to delete note' };
    }
  }

  /**
   * Search notes by content or title
   */
  async searchNotes(orgId: string, query: string): Promise<DashboardNote[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('crm_dashboard_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('org_id', orgId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Failed to search notes:', error);
        return [];
      }

      return (data || []) as DashboardNote[];
    } catch (error) {
      console.error('Search notes error:', error);
      return [];
    }
  }

  /**
   * Get notes linked to a specific entity
   */
  async getLinkedNotes(
    entityType: 'lead' | 'contact' | 'deal' | 'account',
    entityId: string
  ): Promise<DashboardNote[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_dashboard_notes')
        .select('*')
        .eq('linked_entity_type', entityType)
        .eq('linked_entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get linked notes:', error);
        return [];
      }

      return (data || []) as DashboardNote[];
    } catch (error) {
      console.error('Get linked notes error:', error);
      return [];
    }
  }
}

// Factory function
export function createDashboardNotesService(supabase: SupabaseClient): DashboardNotesService {
  return new DashboardNotesService(supabase);
}
