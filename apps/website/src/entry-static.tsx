/**
 * Static/SSG entry point for build-time pre-rendering.
 *
 * Used by scripts/prerender-html.mjs to generate full above-the-fold HTML
 * for key marketing routes. React hydrates over this shell seamlessly.
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';

interface RenderResult {
  html: string;
}

export async function render(url: string): Promise<RenderResult> {
  const helmetContext = {};

  const { StaticShell } = await import('./StaticShell');

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <StaticShell />
      </StaticRouter>
    </HelmetProvider>
  );

  return { html };
}
