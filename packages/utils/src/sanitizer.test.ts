import { describe, it, expect } from 'vitest';
import { sanitizeHtml, escapeHtml } from './sanitizer';

// Pins the DOMPurify-based sanitizer as the single sanitizer after the
// website fork was deleted (2026-07 auth consolidation, ADR-0001). The
// fork's hand-rolled allowlist (p/ul/li/strong/a only) is superseded; the
// package allows rich-text tags while stripping XSS vectors.

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    expect(sanitizeHtml('<p>ok</p><script>alert(1)</script>')).toBe('<p>ok</p>');
  });

  it('removes event handler attributes', () => {
    const out = sanitizeHtml('<img src="x.png" onerror="alert(1)">');
    expect(out).toContain('<img');
    expect(out).not.toContain('onerror');
  });

  it('removes javascript: URIs', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain('javascript:');
  });

  it('keeps rich-text tags the deleted fork stripped', () => {
    const html = '<h2>Title</h2><table><tr><td>cell</td></tr></table>';
    const out = sanitizeHtml(html);
    expect(out).toContain('<h2>');
    expect(out).toContain('<td>');
  });

  it('keeps safe links with href', () => {
    const out = sanitizeHtml('<a href="https://example.com">link</a>');
    expect(out).toContain('href="https://example.com"');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null as unknown as string)).toBe('');
  });
});

describe('escapeHtml', () => {
  it('escapes HTML metacharacters', () => {
    expect(escapeHtml('<b>&"\'</b>')).toBe('&lt;b&gt;&amp;&quot;&#39;&lt;&#x2F;b&gt;');
  });
});
