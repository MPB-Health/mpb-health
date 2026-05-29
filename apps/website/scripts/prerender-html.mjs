#!/usr/bin/env node
/**
 * Build-time HTML pre-renderer (SSG).
 *
 * Renders top marketing routes to full HTML at build time using Vite SSR.
 * The output HTML goes into dist/<route>/index.html and includes actual
 * rendered React content inside <div id="root">. When the browser loads,
 * React hydrates over the pre-rendered DOM seamlessly.
 *
 * Run after `vite build`: node scripts/prerender-html.mjs
 *
 * Prerequisites:
 *   - dist/ must exist (run `vite build` first)
 *   - src/entry-static.tsx must export a `render(url)` function
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(APP_ROOT, 'dist');

const ROUTES_TO_PRERENDER = [
  '/',
  '/plans',
  '/how-it-works',
  '/individuals-and-families',
  '/businesses-and-organizations',
  '/faq',
  '/about-us',
  '/contact',
  '/get-a-quote',
];

async function main() {
  if (!existsSync(DIST_DIR)) {
    console.error('❌ prerender-html: dist/ not found. Run `vite build` first.');
    process.exit(1);
  }

  const templatePath = path.join(DIST_DIR, 'index.html');
  if (!existsSync(templatePath)) {
    console.error('❌ prerender-html: dist/index.html not found.');
    process.exit(1);
  }

  console.log('\n🔨 Pre-rendering marketing pages (SSG)...\n');

  // Create a Vite dev server in SSR mode (no actual server, just module loading)
  const vite = await createServer({
    root: APP_ROOT,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'warn',
    // Mock browser globals for SSR
    ssr: {
      noExternal: ['react-router-dom'],
    },
  });

  // Polyfill minimal browser globals for React component rendering
  globalThis.window = globalThis.window || {
    location: { hostname: 'mpb.health', pathname: '/', search: '', hash: '' },
    navigator: { userAgent: 'prerender' },
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: () => {},
    scrollTo: () => {},
    innerWidth: 1920,
    innerHeight: 1080,
    getComputedStyle: () => ({}),
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  };
  globalThis.document = globalThis.document || {
    createElement: () => ({ style: {}, setAttribute: () => {}, appendChild: () => {} }),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    head: { appendChild: () => {}, querySelector: () => null },
    body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {} } },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  globalThis.navigator = globalThis.navigator || { userAgent: 'prerender' };
  globalThis.IntersectionObserver = globalThis.IntersectionObserver || class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.ResizeObserver = globalThis.ResizeObserver || class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.requestAnimationFrame = globalThis.requestAnimationFrame || ((cb) => setTimeout(cb, 0));
  globalThis.requestIdleCallback = globalThis.requestIdleCallback || ((cb) => setTimeout(cb, 0));

  let successCount = 0;
  let failCount = 0;
  let renderFn;

  try {
    const mod = await vite.ssrLoadModule('/src/entry-static.tsx');
    renderFn = mod.render;
  } catch (err) {
    console.warn(`  ⚠ Could not load entry-static.tsx: ${err.message?.slice(0, 100)}`);
    console.warn('    Skipping HTML pre-rendering (SEO meta tags still applied).');
    await vite.close();
    return;
  }

  for (const route of ROUTES_TO_PRERENDER) {
    try {
      const { html: appHtml } = await renderFn(route);

      // Read the template (might have been modified by prerender-seo.mjs already)
      const routeDir = route === '/' ? '' : route.replace(/^\//, '');
      const routeHtmlPath = routeDir
        ? path.join(DIST_DIR, routeDir, 'index.html')
        : path.join(DIST_DIR, 'index.html');

      const templateHtml = existsSync(routeHtmlPath)
        ? readFileSync(routeHtmlPath, 'utf8')
        : readFileSync(templatePath, 'utf8');

      // Inject rendered HTML into the root div
      const finalHtml = templateHtml.replace(
        '<div id="root"></div>',
        `<div id="root">${appHtml}</div>`
      );

      // Write output
      if (routeDir) {
        mkdirSync(path.join(DIST_DIR, routeDir), { recursive: true });
      }
      writeFileSync(routeHtmlPath, finalHtml, 'utf8');
      successCount++;
      console.log(`  ✓ ${route}`);
    } catch (err) {
      failCount++;
      console.warn(`  ⚠ ${route} — skipped (${err.message?.slice(0, 80) || err})`);
    }
  }

  await vite.close();

  console.log(`\n✅ prerender-html: ${successCount} pages rendered, ${failCount} skipped.\n`);
}

main().catch((err) => {
  console.error('❌ prerender-html failed:', err);
  process.exit(1);
});
