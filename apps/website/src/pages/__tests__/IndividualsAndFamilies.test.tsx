/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import IndividualsAndFamilies from '../IndividualsAndFamilies';

describe('IndividualsAndFamilies page', () => {
  it('mounts without throwing (client render smoke test)', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const root = createRoot(container);
    const helmetContext = {};

    expect(() => {
      act(() => {
        root.render(
          <HelmetProvider context={helmetContext}>
            <MemoryRouter>
              <IndividualsAndFamilies />
            </MemoryRouter>
          </HelmetProvider>
        );
      });
    }).not.toThrow();

    act(() => {
      root.unmount();
    });

    container.remove();
  });
});

