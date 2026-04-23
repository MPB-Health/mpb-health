/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Microsoft Bookings (or other) URL; default is org “Speak with an advisor” page */
  readonly VITE_ADVISOR_BOOKING_URL?: string;
  /** Optional: duplicate general support email in Help (full contact also on booking page) */
  readonly VITE_ADVISOR_CONTACT_EMAIL?: string;
  /** Optional: general phone shown in Help */
  readonly VITE_ADVISOR_CONTACT_PHONE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
