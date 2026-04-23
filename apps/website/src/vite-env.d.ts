/// <reference types="vite/client" />

/** Augment with website-specific Vite env vars (merged with Vite’s defaults) */
interface ImportMetaEnv {
  /** Optional override for advisor booking (default: Microsoft Bookings org page) */
  readonly VITE_SALES_BOOKING_URL?: string;
}
