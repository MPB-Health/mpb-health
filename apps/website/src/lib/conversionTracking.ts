import { supabase } from './supabase';

export interface ConversionEvent {
  event_type: 'page_view' | 'cta_click' | 'form_start' | 'form_submit' | 'quote_request' | 'exit_intent';
  page_url: string;
  cta_text?: string;
  cta_location?: string;
  form_id?: string;
  user_id?: string;
  session_id: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  metadata?: Record<string, any>;
}

export interface ConversionFunnel {
  step: 'awareness' | 'consideration' | 'intent' | 'conversion' | 'retention';
  substep: string;
  completed_at: string;
}

let sessionId: string | null = null;

const getSessionId = (): string => {
  if (sessionId) return sessionId;

  let stored = sessionStorage.getItem('conversion_session_id');
  if (!stored) {
    stored = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('conversion_session_id', stored);
  }
  sessionId = stored;
  return stored;
};

const getUTMParams = (): { utm_source?: string; utm_medium?: string; utm_campaign?: string } => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
  };
};

export const trackConversionEvent = async (
  eventType: ConversionEvent['event_type'],
  additionalData?: Partial<ConversionEvent>
): Promise<void> => {
  try {
    const event: ConversionEvent = {
      event_type: eventType,
      page_url: window.location.pathname,
      session_id: getSessionId(),
      referrer: document.referrer || undefined,
      ...getUTMParams(),
      ...additionalData,
    };

    const { error } = await supabase.from('conversion_events').insert(event);

    if (error) {
      console.warn('Failed to track conversion event:', error);
    }
  } catch (err) {
    console.warn('Error tracking conversion event:', err);
  }
};

export const trackCTAClick = async (
  ctaText: string,
  ctaLocation: string,
  destination: string
): Promise<void> => {
  await trackConversionEvent('cta_click', {
    cta_text: ctaText,
    cta_location: ctaLocation,
    metadata: { destination },
  });
};

export const trackFormInteraction = async (
  formId: string,
  action: 'start' | 'submit' | 'abandon',
  fieldData?: Record<string, any>
): Promise<void> => {
  const eventType = action === 'submit' ? 'form_submit' : 'form_start';

  await trackConversionEvent(eventType, {
    form_id: formId,
    metadata: {
      action,
      ...fieldData,
    },
  });
};

export const trackQuoteRequest = async (
  planType: string,
  householdType: string,
  estimatedMonthly?: number
): Promise<void> => {
  await trackConversionEvent('quote_request', {
    metadata: {
      plan_type: planType,
      household_type: householdType,
      estimated_monthly: estimatedMonthly,
    },
  });
};

export const trackExitIntent = async (variant: string): Promise<void> => {
  await trackConversionEvent('exit_intent', {
    metadata: { variant },
  });
};

export const trackFunnelStep = async (
  step: ConversionFunnel['step'],
  substep: string,
  userId?: string
): Promise<void> => {
  try {
    const funnelData: ConversionFunnel = {
      step,
      substep,
      completed_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('conversion_funnel').insert({
      ...funnelData,
      user_id: userId,
      session_id: getSessionId(),
    });

    if (error) {
      console.warn('Failed to track funnel step:', error);
    }
  } catch (err) {
    console.warn('Error tracking funnel step:', err);
  }
};

export const getConversionRate = async (
  startDate: Date,
  endDate: Date
): Promise<{
  total_visitors: number;
  quote_requests: number;
  conversions: number;
  conversion_rate: number;
}> => {
  try {
    const { data: visitors, error: visitorsError } = await supabase
      .from('conversion_events')
      .select('session_id', { count: 'exact', head: false })
      .eq('event_type', 'page_view')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: quotes, error: quotesError } = await supabase
      .from('conversion_events')
      .select('session_id', { count: 'exact', head: false })
      .eq('event_type', 'quote_request')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: conversions, error: conversionsError } = await supabase
      .from('conversion_events')
      .select('session_id', { count: 'exact', head: false })
      .eq('event_type', 'form_submit')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (visitorsError || quotesError || conversionsError) {
      throw new Error('Failed to fetch conversion data');
    }

    const uniqueVisitors = new Set(visitors?.map(v => v.session_id) || []).size;
    const quoteRequests = quotes?.length || 0;
    const totalConversions = conversions?.length || 0;

    return {
      total_visitors: uniqueVisitors,
      quote_requests: quoteRequests,
      conversions: totalConversions,
      conversion_rate: uniqueVisitors > 0 ? (totalConversions / uniqueVisitors) * 100 : 0,
    };
  } catch (err) {
    console.error('Error calculating conversion rate:', err);
    return {
      total_visitors: 0,
      quote_requests: 0,
      conversions: 0,
      conversion_rate: 0,
    };
  }
};

export const getTopCTAs = async (
  limit: number = 10
): Promise<Array<{ cta_text: string; clicks: number; conversion_rate: number }>> => {
  try {
    const { data, error } = await supabase
      .from('conversion_events')
      .select('cta_text, session_id')
      .eq('event_type', 'cta_click')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Failed to fetch top CTAs:', error);
      return [];
    }

    const ctaCounts = (data || []).reduce((acc: any, item: any) => {
      const key = item.cta_text || 'Unknown';
      if (!acc[key]) {
        acc[key] = { cta_text: key, clicks: 0, sessions: new Set() };
      }
      acc[key].clicks++;
      acc[key].sessions.add(item.session_id);
      return acc;
    }, {});

    return Object.values(ctaCounts)
      .map((cta: any) => ({
        cta_text: cta.cta_text,
        clicks: cta.clicks,
        conversion_rate: 0,
      }))
      .sort((a: any, b: any) => b.clicks - a.clicks)
      .slice(0, limit);
  } catch (err) {
    console.error('Error fetching top CTAs:', err);
    return [];
  }
};

export const getFunnelDropoff = async (): Promise<
  Array<{ step: string; visitors: number; dropoff_rate: number }>
> => {
  try {
    const { data, error } = await supabase
      .from('conversion_funnel')
      .select('step, session_id')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Failed to fetch funnel data:', error);
      return [];
    }

    const stepCounts = (data || []).reduce((acc: any, item: any) => {
      const step = item.step;
      if (!acc[step]) {
        acc[step] = new Set();
      }
      acc[step].add(item.session_id);
      return acc;
    }, {});

    const steps = ['awareness', 'consideration', 'intent', 'conversion', 'retention'];
    const results = [];
    let previousCount = 0;

    for (const step of steps) {
      const count = stepCounts[step]?.size || 0;
      const dropoffRate = previousCount > 0 ? ((previousCount - count) / previousCount) * 100 : 0;

      results.push({
        step,
        visitors: count,
        dropoff_rate: dropoffRate,
      });

      previousCount = count;
    }

    return results;
  } catch (err) {
    console.error('Error fetching funnel dropoff:', err);
    return [];
  }
};
