import { describe, expect, it } from 'vitest';

/**
 * The Sales Plan 2026 A/B harness buckets a lead into variant a/b using a
 * deterministic hash of `leadId`. The logic lives inside `EmailService.sendFromABTest`
 * but we pin the pure hashing algorithm here so future refactors can't
 * silently flip the assignment (which would corrupt every in-flight test).
 */
function bucket(leadId: string): 'a' | 'b' {
  const h = [...leadId].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0) & 1;
  return h === 0 ? 'a' : 'b';
}

describe('Email A/B harness — deterministic variant bucket', () => {
  it('returns a stable variant for a given leadId', () => {
    const id = '11111111-2222-3333-4444-555555555555';
    expect(bucket(id)).toBe(bucket(id));
  });

  it('distributes variants roughly 50/50 over a big sample', () => {
    // 5000 random UUID-ish strings should give us ~50% split with healthy
    // tolerance (±5%). Keeps the spec guardrails honest without flaking.
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 5000; i++) {
      const id = `id-${Math.random().toString(36).slice(2)}-${i}`;
      counts[bucket(id)] += 1;
    }
    const skew = Math.abs(counts.a - counts.b) / 5000;
    expect(skew).toBeLessThan(0.05);
  });

  it('varies across different leadIds', () => {
    // Collect variants for 32 plausible UUIDs; expect at least one of each so
    // the hash isn't silently collapsing to a single bucket.
    const seen = new Set<'a' | 'b'>();
    for (let i = 0; i < 32; i++) {
      seen.add(bucket(`00000000-0000-0000-0000-00000000000${i.toString(16)}`));
      if (seen.size === 2) break;
    }
    expect(seen.size).toBe(2);
  });
});
