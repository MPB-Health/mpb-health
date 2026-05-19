import { supabase } from '@mpbhealth/database';

export type RevisionEntityType = 'page' | 'blog_post';

export interface CmsRevision {
  id: string;
  entity_type: RevisionEntityType;
  entity_id: string;
  version: number;
  data_snapshot: Record<string, unknown>;
  change_summary: string;
  changed_by: string | null;
  created_at: string;
}

const SELECT_COLUMNS =
  'id, entity_type, entity_id, version, data_snapshot, change_summary, changed_by, created_at';

export class RevisionService {
  async getRevisions(entityType: RevisionEntityType, entityId: string): Promise<CmsRevision[]> {
    const { data, error } = await supabase
      .from('cms_revisions')
      .select(SELECT_COLUMNS)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('version', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as CmsRevision[];
  }

  async getRevision(id: string): Promise<CmsRevision | null> {
    const { data, error } = await supabase
      .from('cms_revisions')
      .select(SELECT_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as CmsRevision | null) ?? null;
  }

  async getLatestVersion(entityType: RevisionEntityType, entityId: string): Promise<number> {
    const { data, error } = await supabase
      .from('cms_revisions')
      .select('version')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data as { version: number } | null)?.version ?? 0;
  }

  async saveRevision(
    entityType: RevisionEntityType,
    entityId: string,
    dataSnapshot: Record<string, unknown>,
    options?: { change_summary?: string; changed_by?: string | null }
  ): Promise<CmsRevision> {
    const latestVersion = await this.getLatestVersion(entityType, entityId);
    const nextVersion = latestVersion + 1;

    const { data, error } = await supabase
      .from('cms_revisions')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        version: nextVersion,
        data_snapshot: dataSnapshot,
        change_summary: options?.change_summary || '',
        changed_by: options?.changed_by || null,
      })
      .select(SELECT_COLUMNS)
      .single();

    if (error) throw error;
    return data as unknown as CmsRevision;
  }

  async deleteOldRevisions(
    entityType: RevisionEntityType,
    entityId: string,
    keepCount: number = 50
  ): Promise<void> {
    const { data } = await supabase
      .from('cms_revisions')
      .select('id, version')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('version', { ascending: false });

    if (!data || data.length <= keepCount) return;

    const idsToDelete = data.slice(keepCount).map((r: { id: string }) => r.id);
    if (idsToDelete.length > 0) {
      await supabase.from('cms_revisions').delete().in('id', idsToDelete);
    }
  }

  compareRevisions(
    revisionA: CmsRevision,
    revisionB: CmsRevision
  ): { added: string[]; removed: string[]; changed: string[] } {
    const keysA = Object.keys(revisionA.data_snapshot);
    const keysB = Object.keys(revisionB.data_snapshot);

    const added = keysB.filter((k) => !keysA.includes(k));
    const removed = keysA.filter((k) => !keysB.includes(k));
    const changed = keysA.filter(
      (k) =>
        keysB.includes(k) &&
        JSON.stringify(revisionA.data_snapshot[k]) !== JSON.stringify(revisionB.data_snapshot[k])
    );

    return { added, removed, changed };
  }
}

export const revisionService = new RevisionService();
