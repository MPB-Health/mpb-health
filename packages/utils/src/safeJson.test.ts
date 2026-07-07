import { describe, it, expect } from 'vitest';
import { safeJsonParse, safeJsonStringify } from './safeJson';

// Pins the standardized contract after the website fork was deleted
// (2026-07 auth consolidation, ADR-0001). The fork returned a
// { success, data, error } envelope; the package returns the value or
// undefined. Callers were updated to this contract.

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
    expect(safeJsonParse<number[]>('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('returns undefined for invalid JSON without a default', () => {
    expect(safeJsonParse('not json')).toBeUndefined();
    expect(safeJsonParse('{broken')).toBeUndefined();
  });

  it('returns the default value for invalid JSON', () => {
    expect(safeJsonParse('not json', [])).toEqual([]);
    expect(safeJsonParse('{broken', { fallback: true })).toEqual({ fallback: true });
  });

  it('parses JSON null (no envelope semantics)', () => {
    // The deleted fork treated null as a failure; the package contract
    // returns the parsed value as-is.
    expect(safeJsonParse('null')).toBeNull();
  });
});

describe('safeJsonStringify', () => {
  it('stringifies plain values', () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
    expect(safeJsonStringify([1, 2])).toBe('[1,2]');
  });

  it('returns undefined instead of throwing on circular structures', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(safeJsonStringify(circular)).toBeUndefined();
  });

  it('supports replacer and space arguments', () => {
    expect(safeJsonStringify({ a: 1 }, undefined, 2)).toBe('{\n  "a": 1\n}');
  });

  it('returns undefined for undefined input (callers must handle it)', () => {
    // The deleted fork returned "{}" here; schemaUtils already guards
    // against a falsy result, so the contract is undefined.
    expect(safeJsonStringify(undefined)).toBeUndefined();
  });
});
