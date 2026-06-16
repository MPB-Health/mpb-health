/* @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { EnrollmentEmbed } from './EnrollmentEmbed';

function renderEmbed(embedUrl: string, title: string) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<EnrollmentEmbed embedUrl={embedUrl} title={title} />);
  });

  return {
    container,
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe('EnrollmentEmbed', () => {
  it('embeds allowed HTTPS enrollmpb.com URL in iframe', () => {
    const { container, cleanup } = renderEmbed('https://essentials.enrollmpb.com/', 'Essentials');

    const iframe = container.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute('src')).toBe('https://essentials.enrollmpb.com/');
    expect((iframe as HTMLIFrameElement).referrerPolicy).toBe('strict-origin-when-cross-origin');

    cleanup();
  });

  it('refuses to embed disallowed URLs', () => {
    const { container, cleanup } = renderEmbed('https://evil.example.com/', 'Evil');
    expect(container.querySelector('iframe')).toBeNull();
    cleanup();
  });
});
