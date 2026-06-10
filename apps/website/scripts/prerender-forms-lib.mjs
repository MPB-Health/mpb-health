import { SITE_URL, normalizeDescription } from './prerender-seo-lib.mjs';

/** DB slug `/member-change-request/` → URL param `member-change-request` */
export function formSlugToParam(slug) {
  return String(slug || '').replace(/^\/+|\/+$/g, '');
}

export function formToRoute(slug) {
  const param = formSlugToParam(slug);
  return param ? `/forms/${param}` : null;
}

export function staticFormPath(slug) {
  const param = formSlugToParam(slug);
  return param ? `/${param}` : null;
}

/**
 * @param {Set<string>} staticRouteSet Root paths already prerendered in page-seo-extra (e.g. `/list-bill-setup`).
 */
export function buildFormSeoMeta(form, staticRouteSet = new Set()) {
  const param = formSlugToParam(form.slug);
  if (!param || !form.label) return null;

  const route = `/forms/${param}`;
  const rootPath = `/${param}`;
  const hasStaticRoute = staticRouteSet.has(rootPath);

  const description = normalizeDescription(
    form.description,
    `Complete the ${form.label} form online with MPB Health. Secure submission with confirmation — no phone call required.`,
  );

  return {
    route,
    meta: {
      title: `${form.label} | MPB Health Member Form`,
      h1: form.label,
      description,
      bodyExcerpt: description.slice(0, 480),
      canonicalUrl: hasStaticRoute ? `${SITE_URL}${rootPath}` : `${SITE_URL}${route}`,
      robots: form.requires_auth ? 'noindex, follow' : 'index, follow',
    },
  };
}

export function isIndexableFormMeta(meta) {
  return !String(meta.robots || '').toLowerCase().includes('noindex');
}
