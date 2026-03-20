/**
 * Ref-counted body overflow lock so stacked modals/overlays do not leave
 * `document.body` stuck with overflow:hidden after the last overlay closes.
 */

let lockCount = 0;

export function acquireBodyScrollLock(): () => void {
  lockCount += 1;
  if (lockCount === 1) {
    document.body.style.overflow = 'hidden';
  }
  return () => {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = '';
    }
  };
}
