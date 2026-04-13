export interface PoolMember {
  user_id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_paused: boolean;
  paused_reason?: string;
}

export interface RoundRobinConfig {
  id: string;
  org_id: string;
  is_active: boolean;
  pool_members: PoolMember[];
  current_position: number;
  tie_breaking_rule: 'sequential' | 'least_leads' | 'random';
  skip_unavailable: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoundRobinConfigInput {
  is_active?: boolean;
  pool_members?: PoolMember[];
  tie_breaking_rule?: RoundRobinConfig['tie_breaking_rule'];
  skip_unavailable?: boolean;
}

export interface RoundRobinAuditEntry {
  id: string;
  org_id: string;
  lead_id: string;
  assigned_to: string;
  position_at_assignment: number;
  was_skip: boolean;
  skip_reason: string | null;
  override_by: string | null;
  created_at: string;
}

export interface AssignmentResult {
  assigned_to: string;
  was_skip: boolean;
  position: number;
}
