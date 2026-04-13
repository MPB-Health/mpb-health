export type CommunityEventType =
  | 'church_partnership'
  | 'hydration_booth'
  | 'chamber_bni_sbdc'
  | 'health_fair'
  | 'co_sponsored'
  | 'other';

export interface CommunityEvent {
  id: string;
  org_id: string;
  name: string;
  event_type: CommunityEventType;
  event_date: string;
  location: string | null;
  contacts_captured: number;
  leads_generated: number;
  rep_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityEventInput {
  name: string;
  event_type?: CommunityEventType;
  event_date: string;
  location?: string;
  contacts_captured?: number;
  leads_generated?: number;
  rep_id?: string;
  notes?: string;
}

export interface CommunityEventStats {
  total_events: number;
  total_contacts: number;
  total_leads: number;
  by_type: Record<string, number>;
}
