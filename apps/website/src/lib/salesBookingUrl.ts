/**
 * Microsoft Bookings page for “Speak with an advisor” — all team members, shared calendar.
 * Override with VITE_SALES_BOOKING_URL in env if the org changes the booking service.
 */
export const DEFAULT_SALES_BOOKING_URL =
  'https://bookings.cloud.microsoft/book/SpeakWithaAdvisor@NETORG6712533.onmicrosoft.com/?ismsaljsauthenabled=true';

export function getSalesBookingUrl(): string {
  const fromEnv = import.meta.env.VITE_SALES_BOOKING_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return fromEnv.trim();
  }
  return DEFAULT_SALES_BOOKING_URL;
}
