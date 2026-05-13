// Hostname-aware brand switching shared across portal apps.
//
// Today: *.aryxcloud.com → ARYX brand; everything else (*.mpb.health,
// localhost, preview URLs) → MPB Health brand.
//
// Each app calls initBrand({ mpbLogo: '...' }) once from main.tsx with its
// own mpb-logo fallback path, then renders logos via getBrandLogo() and
// styles via the .brand-aryx CSS overlay (./aryx-brand.css).
//
// When the full Phase 2 tenant-driven theming lands (white_label_configs
// resolved from logged-in org), this module becomes the unauthenticated-
// default fallback while authenticated routes resolve theme from the org.

export type Brand = 'mpb' | 'aryx';

const LOCAL_OVERRIDE_KEY = 'brand';

// Convention paths for ARYX assets — each app must place these in its
// public/assets/ directory. Standardizing the path keeps the shared module
// agnostic of where each app serves its static files from.
const ARYX_LOGO      = '/assets/aryx-logo.png';
const ARYX_LOGO_DARK = '/assets/aryx-logo-light.png';

// App-level config set by initBrand(). Per-app mpb-logo path (the brand-
// agnostic library doesn't know whether your app uses /logo.png or
// /assets/MPB-Health-No-background.png — you tell it once at startup).
let _mpbLogo: string = '/logo.png';
let _mpbLogoDark: string = '/logo.png';

export interface InitBrandOptions {
  /** Path to the MPB-Health logo served by this app (e.g. '/logo.png'). */
  mpbLogo: string;
  /** Optional dark-surface variant; defaults to mpbLogo. */
  mpbLogoDark?: string;
}

export function detectBrand(): Brand {
  if (typeof window === 'undefined') return 'mpb';

  // Local override for testing — set localStorage.brand = 'aryx' in devtools.
  try {
    const override = window.localStorage.getItem(LOCAL_OVERRIDE_KEY);
    if (override === 'aryx' || override === 'mpb') return override;
  } catch {
    /* localStorage blocked — ignore */
  }

  const host = window.location.hostname;
  if (host === 'aryxcloud.com' || host.endsWith('.aryxcloud.com')) return 'aryx';

  return 'mpb';
}

export function applyBrandClass(): void {
  if (typeof document === 'undefined') return;
  const brand = detectBrand();
  const root = document.documentElement;
  root.classList.remove('brand-mpb', 'brand-aryx');
  root.classList.add(`brand-${brand}`);
}

/**
 * Call once from main.tsx before render. Registers the app's mpb-logo paths
 * and stamps the `brand-mpb` / `brand-aryx` class on `<html>` so the overlay
 * CSS applies on first paint.
 */
export function initBrand(opts: InitBrandOptions): void {
  _mpbLogo = opts.mpbLogo;
  _mpbLogoDark = opts.mpbLogoDark ?? opts.mpbLogo;
  applyBrandClass();
}

export function getBrandLogo(opts: { dark?: boolean } = {}): string {
  if (detectBrand() === 'aryx') {
    return opts.dark ? ARYX_LOGO_DARK : ARYX_LOGO;
  }
  return opts.dark ? _mpbLogoDark : _mpbLogo;
}
