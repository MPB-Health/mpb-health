import { describe, it, expect } from 'vitest';
import {
  ALL_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  type UserRole,
} from './userRolesService';

// Pins the role vocabulary the website adopted when its fork was deleted
// (2026-07 auth consolidation, ADR-0001). Delta over the fork: the
// 'concierge' role. UI components index Record<UserRole, ...> maps, so every
// role must have a label, description, and color.

describe('role constants', () => {
  it('includes the concierge role (delta over the deleted website fork)', () => {
    expect(ALL_ROLES).toContain('concierge');
  });

  it('includes staff_hr (HR Staff Admin for Staff Hub)', () => {
    expect(ALL_ROLES).toContain('staff_hr');
    expect(ROLE_LABELS.staff_hr).toBe('HR Staff Admin');
  });

  it('covers every role with a label, description, and color', () => {
    for (const role of ALL_ROLES) {
      expect(ROLE_LABELS[role], `label for ${role}`).toBeTruthy();
      expect(ROLE_DESCRIPTIONS[role], `description for ${role}`).toBeTruthy();
      expect(ROLE_COLORS[role], `color for ${role}`).toBeTruthy();
    }
  });

  it('keeps member as a listed role (everyone gets member portal access)', () => {
    const roles: UserRole[] = ALL_ROLES;
    expect(roles).toContain('member');
  });
});
