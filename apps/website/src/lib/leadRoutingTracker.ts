import { supabase } from './supabase';
import { trackEvent } from './analytics';
import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('LeadRouting');

export interface CTAClickContext {
  ctaType: 'enroll_now' | 'get_quote' | 'see_plans' | 'calculator_result' | 'plan_select' | 'comparison_grid_select';
  ctaText: string;
  ctaLocation: string;
  planType?: string;
  householdSize?: number;
  estimatedPremium?: number;
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('mpb_session_id');

  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('mpb_session_id', sessionId);
  }

  return sessionId;
}

function getUTMParams(): { source?: string; medium?: string; campaign?: string } {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
  };
}

export async function trackCTAClick(context: CTAClickContext): Promise<void> {
  try {
    const sessionId = getSessionId();
    const utm = getUTMParams();
    const { data: { user } } = await supabase.auth.getUser();

    const logData = {
      session_id: sessionId,
      user_id: user?.id,
      page_path: window.location.pathname,
      cta_type: context.ctaType,
      cta_text: context.ctaText,
      cta_location: context.ctaLocation,
      plan_type: context.planType,
      household_size: context.householdSize,
      estimated_premium: context.estimatedPremium,
      referrer: document.referrer || undefined,
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
    };

    await supabase
      .from('lead_routing_logs')
      .insert(logData);

    trackEvent('cta_click', {
      cta_type: context.ctaType,
      cta_text: context.ctaText,
      location: context.ctaLocation,
      plan_type: context.planType,
    });

    log.info('[Lead Routing] CTA click tracked:', context);
  } catch (error) {
    console.error('[Lead Routing] Failed to track CTA click:', error);
  }
}

export function buildQuoteURL(context: CTAClickContext): string {
  const params = new URLSearchParams();

  params.set('from', window.location.pathname);
  params.set('cta', context.ctaType);

  if (context.planType) {
    params.set('plan', context.planType);
  }

  if (context.householdSize) {
    params.set('household', context.householdSize.toString());
  }

  if (context.estimatedPremium) {
    params.set('premium', context.estimatedPremium.toString());
  }

  const utm = getUTMParams();
  if (utm.source) params.set('utm_source', utm.source);
  if (utm.medium) params.set('utm_medium', utm.medium);
  if (utm.campaign) params.set('utm_campaign', utm.campaign);

  return `/get-a-quote?${params.toString()}`;
}

export async function trackAndNavigateToQuote(context: CTAClickContext): Promise<void> {
  await trackCTAClick(context);

  const url = buildQuoteURL(context);
  window.location.href = url;
}
