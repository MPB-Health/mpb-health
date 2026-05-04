import { supabase } from './supabase';

const SESSION_KEY = 'mpb_quote_calc_session_v1';

/** Stable per-browser ID so funnel events and lead form_data can be correlated. */
export function getQuoteCalculatorSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export type QuoteCalculatorFunnelEvent = 'results_viewed' | 'contact_opened' | 'lead_submitted';

/** Records anonymous hero-calculator funnel events (fire-and-forget). */
export function recordQuoteCalculatorEvent(
  eventType: QuoteCalculatorFunnelEvent,
  metadata: Record<string, unknown> = {},
): void {
  const session_id = getQuoteCalculatorSessionId();
  if (!session_id) return;

  void supabase
    .rpc('record_quote_calculator_event', {
      payload: { session_id, event_type: eventType, metadata },
    })
    .then(({ error }) => {
      if (error) {
        console.warn('[quote funnel]', error.message);
      }
    });
}
