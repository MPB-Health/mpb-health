/** True when invokeWithResolvedAuth could not obtain a bearer token. */
export function isSessionExpiredMessage(message: string): boolean {
  return /session has expired|please sign in again|SESSION_DEAD/i.test(message);
}

/**
 * When the session latch fired, send the admin back to login instead of leaving
 * them on a page that still looks authenticated.
 */
export function handleAuthFailureMessage(message: string): void {
  if (isSessionExpiredMessage(message)) {
    window.location.assign('/login');
  }
}
