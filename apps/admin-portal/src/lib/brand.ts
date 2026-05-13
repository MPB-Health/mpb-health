// Hostname-aware brand switching for the admin-portal app.
//
// Today: admin.aryxcloud.com → ARYX brand; everything else (admin.mpb.health,
// localhost, preview URLs) → MPB Health brand.
//
// This is the tactical "Phase 1.5" approach. When the full Phase 2 tenant-
// driven theming lands (white_label_configs resolved from logged-in org),
// this module gets demoted to the unauthenticated-default fallback.
//
// TODO(rebrand): hoist into a shared package once 3+ apps use this pattern.

export type Brand = 'mpb' | 'aryx';

const LOCAL_OVERRIDE_KEY = 'brand';

const MPB_LOGO       = '/logo.png';            // admin-portal serves mpb logo here
const ARYX_LOGO      = '/assets/aryx-logo.png';
const ARYX_LOGO_DARK = '/assets/aryx-logo-light.png';

export function detectBrand(): Brand {
  if (typeof window === 'undefined') return 'mpb';

  // Local override for testing — set localStorage.brand = 'aryx' in devtools.
  try {
    const override = window.localStorage.getItem(LOCAL_OVERRIDE_KEY);
    if (override === 'aryx' || override === 'mpb') return override;
  } catch {
    /* localStorage blocked in iframe / private mode — ignore */
  }

  const host = window.location.hostname;
  if (host === 'aryxcloud.com' || host.endsWith('.aryxcloud.com')) return 'aryx';

  return 'mpb';
}

export function getBrandLogo(opts: { dark?: boolean } = {}): string {
  if (detectBrand() === 'aryx') {
    return opts.dark ? ARYX_LOGO_DARK : ARYX_LOGO;
  }
  return MPB_LOGO;
}

export function applyBrandClass(): void {
  if (typeof document === 'undefined') return;
  const brand = detectBrand();
  const root = document.documentElement;
  root.classList.remove('brand-mpb', 'brand-aryx');
  root.classList.add(`brand-${brand}`);
}
