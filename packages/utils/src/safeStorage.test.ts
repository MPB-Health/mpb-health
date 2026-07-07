import { describe, it, expect, beforeEach } from 'vitest';
import { safeLocalStorage, safeSessionStorage } from './safeStorage';

// Pins the standardized storage format after the website fork was deleted
// (2026-07 auth consolidation, ADR-0001). The fork wrapped every value in a
// { value, version, timestamp, ttl } envelope; the package stores the raw
// JSON value. Envelope-format entries left behind by the fork fail shape
// checks at call sites and are rewritten on next use.

describe('safeLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores values as raw JSON, not the legacy envelope', () => {
    safeLocalStorage.setItem('key', ['a', 'b']);
    expect(window.localStorage.getItem('key')).toBe('["a","b"]');
  });

  it('round-trips objects and arrays', () => {
    safeLocalStorage.setItem('obj', { n: 1 });
    expect(safeLocalStorage.getItem<{ n: number }>('obj')).toEqual({ n: 1 });

    safeLocalStorage.setItem('arr', [1, 2, 3]);
    expect(safeLocalStorage.getItem<number[]>('arr')).toEqual([1, 2, 3]);
  });

  it('stores strings without double-encoding', () => {
    safeLocalStorage.setItem('str', 'hello');
    expect(window.localStorage.getItem('str')).toBe('hello');
  });

  it('falls back to the raw string when the stored value is not JSON', () => {
    window.localStorage.setItem('raw', 'plain-text');
    expect(safeLocalStorage.getItem('raw')).toBe('plain-text');
  });

  it('returns the default when the key is missing', () => {
    expect(safeLocalStorage.getItem('missing')).toBeNull();
    expect(safeLocalStorage.getItem<string[]>('missing', [])).toEqual([]);
  });

  it('reads a legacy envelope as the envelope object (callers shape-check)', () => {
    // A leftover fork-format entry: getItem returns the parsed envelope, so
    // an Array.isArray / property check at the call site rejects it.
    window.localStorage.setItem(
      'legacy',
      JSON.stringify({ value: ['x'], version: 1, timestamp: 0 })
    );
    const read = safeLocalStorage.getItem<unknown>('legacy');
    expect(Array.isArray(read)).toBe(false);
    expect(read).toEqual({ value: ['x'], version: 1, timestamp: 0 });
  });

  it('supports removeItem and hasItem', () => {
    safeLocalStorage.setItem('gone', 1);
    expect(safeLocalStorage.hasItem('gone')).toBe(true);
    expect(safeLocalStorage.removeItem('gone')).toBe(true);
    expect(safeLocalStorage.hasItem('gone')).toBe(false);
  });
});

describe('safeSessionStorage', () => {
  it('is independent from localStorage', () => {
    window.sessionStorage.clear();
    safeSessionStorage.setItem('scope', 'session');
    expect(safeSessionStorage.getItem('scope')).toBe('session');
    expect(safeLocalStorage.getItem('scope')).toBeNull();
  });
});
