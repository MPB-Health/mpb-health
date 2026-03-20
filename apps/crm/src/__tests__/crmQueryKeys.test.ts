import { describe, it, expect } from 'vitest';
import { crmQueryKeys } from '../query/crmQueryKeys';

describe('crmQueryKeys', () => {
  it('includes org id so caches never cross tenants', () => {
    const a = crmQueryKeys.dashboard('11111111-1111-1111-1111-111111111111');
    const b = crmQueryKeys.dashboard('22222222-2222-2222-2222-222222222222');
    expect(a).not.toEqual(b);
  });

  it('uses stable tuple roots for invalidation prefixes', () => {
    const org = 'org-1';
    expect(crmQueryKeys.org(org)[0]).toBe('crm');
    expect(crmQueryKeys.dashboard(org)[1]).toBe(org);
    expect(crmQueryKeys.recentLeads(org)[2]).toBe('recentLeads');
    expect(crmQueryKeys.tasks(org)[2]).toBe('tasks');
    expect(crmQueryKeys.calendar(org)[2]).toBe('calendar');
  });

  it('org key is a prefix of all migrated slice keys (invalidateQueries org-wide)', () => {
    const org = '00000000-0000-0000-0000-000000000001';
    const prefix = crmQueryKeys.org(org);
    expect(crmQueryKeys.dashboard(org).slice(0, prefix.length)).toEqual(prefix);
    expect(crmQueryKeys.recentLeads(org).slice(0, prefix.length)).toEqual(prefix);
    expect(crmQueryKeys.tasks(org).slice(0, prefix.length)).toEqual(prefix);
    expect(crmQueryKeys.calendar(org).slice(0, prefix.length)).toEqual(prefix);
  });
});
