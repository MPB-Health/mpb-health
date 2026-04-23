/**
 * Public advisor scheduling and optional general contact (email/phone) for the CRM help UI.
 * Default URL is the org Microsoft Bookings page (all team members; shared contact info appears there).
 * Override in deployment with VITE_ADVISOR_BOOKING_URL, VITE_ADVISOR_CONTACT_EMAIL, VITE_ADVISOR_CONTACT_PHONE.
 */
const DEFAULT_ADVISOR_BOOKING_URL =
  'https://bookings.cloud.microsoft/book/SpeakWithaAdvisor@NETORG6712533.onmicrosoft.com/?ismsaljsauthenabled=true';

export function getAdvisorBookingUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADVISOR_BOOKING_URL) {
    return import.meta.env.VITE_ADVISOR_BOOKING_URL;
  }
  return DEFAULT_ADVISOR_BOOKING_URL;
}

export function getAdvisorContactDisplay(): { email?: string; phone?: string } {
  const email =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ADVISOR_CONTACT_EMAIL : undefined;
  const phone =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ADVISOR_CONTACT_PHONE : undefined;
  return {
    email: email?.trim() || undefined,
    phone: phone?.trim() || undefined,
  };
}
