import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const SITE_URL = 'https://mpb.health';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/MPB-Health-No-background.png?v=2`;

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Trim or lightly pad meta descriptions to a SERP-friendly length. */
export function normalizeDescription(text, fallbackSuffix) {
  const clean = stripHtml(text);
  if (!clean) return fallbackSuffix.slice(0, 160);
  if (clean.length >= 140) {
    return clean.length > 160 ? `${clean.slice(0, 157).trimEnd()}…` : clean;
  }
  const padded = `${clean.replace(/\.+$/, '')}. ${fallbackSuffix}`;
  return padded.length > 160 ? `${padded.slice(0, 157).trimEnd()}…` : padded;
}

function replaceTag(html, regex, replacement) {
  if (!regex.test(html)) {
    return html;
  }
  return html.replace(regex, replacement);
}

function insertOnce(html, identifierRegex, tag) {
  if (identifierRegex.test(html)) {
    return html.replace(identifierRegex, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

export function deriveH1(meta) {
  if (meta.h1) return meta.h1;
  const title = meta.title || '';
  const pipe = title.indexOf('|');
  return pipe > 0 ? title.slice(0, pipe).trim() : title.trim();
}

/**
 * Inject a crawler-visible <h1> + intro paragraph into the static HTML body.
 * React removes #seo-static-fallback on mount (see src/main.tsx).
 */
export function injectStaticBody(html, meta) {
  const h1 = escapeHtml(deriveH1(meta));
  const description = escapeHtml(meta.description || '');
  const bodyExcerpt = meta.bodyExcerpt ? escapeHtml(meta.bodyExcerpt) : '';
  const excerptBlock = bodyExcerpt ? `\n      <p>${bodyExcerpt}</p>` : '';

  const fallback = `    <main id="seo-static-fallback" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;" aria-hidden="true">
      <h1>${h1}</h1>
      <p>${description}</p>${excerptBlock}
    </main>\n`;

  html = html.replace(/\s*<main id="seo-static-fallback"[^>]*>[\s\S]*?<\/main>\s*/gi, '\n');
  html = html.replace('<div id="root"></div>', `${fallback}    <div id="root"></div>`);

  html = html.replace(
    /<h1 style="font-size:2rem;margin:0 0 \.5rem;color:#0f172a;">[^<]*<\/h1>/i,
    `<h1 style="font-size:2rem;margin:0 0 .5rem;color:#0f172a;">${h1}</h1>`,
  );
  html = html.replace(
    /<p style="font-size:1\.125rem;color:#475569;margin:0 0 1rem;">[\s\S]*?<\/p>/,
    `<p style="font-size:1.125rem;color:#475569;margin:0 0 1rem;">${description}</p>`,
  );

  return html;
}

export function applyMetadata(template, meta, route) {
  const canonical = meta.canonicalUrl || `${SITE_URL}${route}`;
  const ogImage = meta.ogImage || DEFAULT_OG_IMAGE;
  const ogTitle = meta.ogTitle || meta.title;
  const ogDescription = meta.ogDescription || meta.description;
  const twitterTitle = meta.twitterTitle || ogTitle;
  const twitterDescription = meta.twitterDescription || ogDescription;

  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const safeCanonical = escapeHtml(canonical);
  const safeOgTitle = escapeHtml(ogTitle);
  const safeOgDescription = escapeHtml(ogDescription);
  const safeOgImage = escapeHtml(ogImage);
  const safeTwitterTitle = escapeHtml(twitterTitle);
  const safeTwitterDescription = escapeHtml(twitterDescription);

  let html = template;

  html = replaceTag(html, /<title>[^<]*<\/title>/i, `<title>${title}</title>`);

  html = replaceTag(
    html,
    /<meta name="description" content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${description}" />`,
  );

  html = replaceTag(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${safeCanonical}" />`,
  );

  html = replaceTag(
    html,
    /<meta property="og:title" content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${safeOgTitle}" />`,
  );

  html = replaceTag(
    html,
    /<meta property="og:description" content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${safeOgDescription}" />`,
  );

  html = replaceTag(
    html,
    /<meta property="og:url" content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${safeCanonical}" />`,
  );

  html = replaceTag(
    html,
    /<meta property="og:image" content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${safeOgImage}" />`,
  );

  if (meta.ogType) {
    html = replaceTag(
      html,
      /<meta property="og:type" content="[^"]*"\s*\/?>/i,
      `<meta property="og:type" content="${escapeHtml(meta.ogType)}" />`,
    );
  }

  html = replaceTag(
    html,
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${safeTwitterTitle}" />`,
  );

  html = replaceTag(
    html,
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${safeTwitterDescription}" />`,
  );

  html = replaceTag(
    html,
    /<meta name="twitter:image" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${safeOgImage}" />`,
  );

  if (meta.keywords) {
    html = insertOnce(
      html,
      /<meta name="keywords" content="[^"]*"\s*\/?>/i,
      `<meta name="keywords" content="${escapeHtml(meta.keywords)}" />`,
    );
  }

  if (meta.robots) {
    html = insertOnce(
      html,
      /<meta name="robots" content="[^"]*"\s*\/?>/i,
      `<meta name="robots" content="${escapeHtml(meta.robots)}" />`,
    );
  }

  html = insertOnce(
    html,
    /<meta name="x-prerender-route" content="[^"]*"\s*\/?>/i,
    `<meta name="x-prerender-route" content="${escapeHtml(route)}" />`,
  );

  html = injectStaticBody(html, meta);

  return html;
}

export function routeToOutputPath(distDir, route) {
  if (!route.startsWith('/')) {
    throw new Error(`Route must start with '/': ${route}`);
  }
  const trimmed = route.replace(/^\/+|\/+$/g, '');
  if (trimmed === '') {
    return path.join(distDir, 'index.html');
  }
  return path.join(distDir, trimmed, 'index.html');
}

export function writePrerenderedRoute({ distDir, template, route, meta }) {
  const html = applyMetadata(template, meta, route);
  const outputPath = routeToOutputPath(distDir, route);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, html, 'utf8');
  return outputPath;
}
