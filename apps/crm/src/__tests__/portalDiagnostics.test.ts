import { describe, it, expect, vi } from 'vitest';
import { emitPortalDiagnostic, subscribePortalDiagnostics } from '@mpbhealth/utils';

describe('portal diagnostics (browser)', () => {
  it('dispatches mpb:portal-diag and notifies subscribers', () => {
    const fn = vi.fn();
    const off = subscribePortalDiagnostics(fn);
    emitPortalDiagnostic({ kind: 'permission_load', app: 'crm', durationMs: 12, success: true });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0][0].kind).toBe('permission_load');
    off();
  });
});
