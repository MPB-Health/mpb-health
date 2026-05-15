/**
 * Click-to-call helper for the Lead / Recruit Profile action row
 * (Section 6 / Round 10 — Action Buttons Execute + Auto-Log).
 *
 * GoTo Connect ships a desktop client that registers the `gotoconnect://`
 * URL scheme. We try that first so the rep's call lands inside their
 * existing GoTo softphone (per spec: "clicking initiates a GoTo Connect
 * call"). If the scheme is not registered the browser will silently
 * ignore it; we then fall back to `tel:` so the OS dialer (or a paired
 * smartphone via Handoff) can take the call. The auto-log path is the
 * caller's responsibility — open the LogCallModal so the rep confirms
 * outcome + duration; LogCallModal writes a `crm_activities` row, which
 * fires `crm_dl_emit_from_activity` so Section 8 / Section 11 capture
 * the touch in the rep's Daily Log automatically.
 */

/** Strip everything except digits and a leading '+'. */
function normalizePhone(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  const digits = trimmed.replace(/[^\d]/g, '');
  if (!digits) return '';
  // Ensure a leading + when the number doesn't carry one already; tel:
  // accepts both, but GoTo Connect prefers E.164.
  if (plus) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits;
}

export interface InitiateCallOptions {
  /** Lead phone number — any free-form format. */
  phone: string;
  /** Optional id passed through to the GoTo deep link as `clientId`. */
  leadId?: string;
}

/**
 * Best-effort dialer launch. Returns the launched URI scheme so the caller
 * can decide whether to surface a "no GoTo Connect detected" hint. The
 * function never throws — failures degrade to `tel:`.
 */
export function initiateGotoConnectCall({ phone, leadId }: InitiateCallOptions): 'goto' | 'tel' | 'noop' {
  if (typeof window === 'undefined') return 'noop';
  const dialable = normalizePhone(phone);
  if (!dialable) return 'noop';

  // GoTo Connect's documented call URI is `gotoconnect://call/<E.164>`.
  // We hide an iframe to invoke it without navigating away from the lead
  // profile (a top-level location change would unmount the page mid-call).
  const gotoUri = leadId
    ? `gotoconnect://call/${encodeURIComponent(dialable)}?clientId=${encodeURIComponent(leadId)}`
    : `gotoconnect://call/${encodeURIComponent(dialable)}`;

  try {
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    frame.src = gotoUri;
    document.body.appendChild(frame);
    // Tear the frame down once the OS has handled (or ignored) the URL.
    window.setTimeout(() => {
      try {
        frame.parentNode?.removeChild(frame);
      } catch {
        // intentional no-op — frame already gone
      }
    }, 1500);
    return 'goto';
  } catch {
    // Fall through to tel:.
  }

  try {
    window.location.href = `tel:${dialable}`;
    return 'tel';
  } catch {
    return 'noop';
  }
}
