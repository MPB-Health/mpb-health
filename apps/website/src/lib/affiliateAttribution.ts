import { supabase, isSupabaseConfigured } from './supabase';

export interface AffiliateClick {
  affiliate_id: string;
  campaign_id?: string;
  referral_code: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  visitor_id: string;
  landing_page: string;
  ip_address?: string;
  user_agent: string;
}

export interface AffiliateConversion {
  affiliate_id: string;
  visitor_id: string;
  conversion_type: 'quote' | 'enrollment' | 'payment';
  conversion_value?: number;
  commission_amount?: number;
}

const COOKIE_NAME = 'mpb_affiliate';
const COOKIE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export const trackAffiliateClick = async (
  referralCode: string,
  utmParams: Record<string, string> = {}
): Promise<void> => {
  if (!isSupabaseConfigured) return;
  try {
    const visitorId = getOrCreateVisitorId();

    const clickData: AffiliateClick = {
      affiliate_id: extractAffiliateId(referralCode),
      referral_code: referralCode,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      visitor_id: visitorId,
      landing_page: window.location.pathname,
      user_agent: navigator.userAgent,
    };

    const { error } = await supabase.from('affiliate_clicks').insert(clickData);

    if (error) {
      console.warn('Failed to track affiliate click:', error);
      return;
    }

    setAffiliateCookie(referralCode);
  } catch (err) {
    console.warn('Error tracking affiliate click:', err);
  }
};

export const trackAffiliateConversion = async (
  conversionType: 'quote' | 'enrollment' | 'payment',
  conversionValue?: number
): Promise<void> => {
  if (!isSupabaseConfigured) return;
  try {
    const affiliateData = getAffiliateCookie();
    if (!affiliateData) return;

    const visitorId = getOrCreateVisitorId();
    const commissionRate = getCommissionRate(conversionType);
    const commissionAmount = conversionValue ? conversionValue * commissionRate : undefined;

    const conversionData: AffiliateConversion = {
      affiliate_id: affiliateData.affiliateId,
      visitor_id: visitorId,
      conversion_type: conversionType,
      conversion_value: conversionValue,
      commission_amount: commissionAmount,
    };

    const { error } = await supabase.from('affiliate_conversions').insert(conversionData);

    if (error) {
      console.warn('Failed to track affiliate conversion:', error);
    }
  } catch (err) {
    console.warn('Error tracking affiliate conversion:', err);
  }
};

export const getAffiliateStats = async (
  affiliateId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  clicks: number;
  conversions: number;
  conversionRate: number;
  totalRevenue: number;
  totalCommissions: number;
}> => {
  try {
    const { count: clickCount, error: clicksError } = await supabase
      .from('affiliate_clicks')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_id', affiliateId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: conversions, error: conversionsError } = await supabase
      .from('affiliate_conversions')
      .select('conversion_value, commission_amount')
      .eq('affiliate_id', affiliateId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (clicksError || conversionsError) {
      throw new Error('Failed to fetch affiliate stats');
    }

    const clickCountValue = clickCount || 0;
    const conversionCount = conversions?.length || 0;
    const totalRevenue = conversions?.reduce((sum, c) => sum + (c.conversion_value || 0), 0) || 0;
    const totalCommissions = conversions?.reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0;

    return {
      clicks: clickCountValue,
      conversions: conversionCount,
      conversionRate: clickCountValue > 0 ? (conversionCount / clickCountValue) * 100 : 0,
      totalRevenue,
      totalCommissions,
    };
  } catch (err) {
    console.error('Error fetching affiliate stats:', err);
    return {
      clicks: 0,
      conversions: 0,
      conversionRate: 0,
      totalRevenue: 0,
      totalCommissions: 0,
    };
  }
};

// Helper functions
const getOrCreateVisitorId = (): string => {
  let visitorId = localStorage.getItem('mpb_visitor_id');
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('mpb_visitor_id', visitorId);
  }
  return visitorId;
};

const extractAffiliateId = (referralCode: string): string => {
  return referralCode.split('_')[0] || referralCode;
};

const setAffiliateCookie = (referralCode: string): void => {
  const data = {
    referralCode,
    affiliateId: extractAffiliateId(referralCode),
    timestamp: Date.now(),
  };

  const expires = new Date(Date.now() + COOKIE_DURATION);
  document.cookie = `${COOKIE_NAME}=${JSON.stringify(data)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`;
};

const getAffiliateCookie = (): { referralCode: string; affiliateId: string } | null => {
  const cookies = document.cookie.split(';');
  const affiliateCookie = cookies.find(c => c.trim().startsWith(`${COOKIE_NAME}=`));

  if (!affiliateCookie) return null;

  try {
    const value = affiliateCookie.split('=')[1];
    const data = JSON.parse(decodeURIComponent(value));

    if (Date.now() - data.timestamp > COOKIE_DURATION) {
      return null;
    }

    return {
      referralCode: data.referralCode,
      affiliateId: data.affiliateId,
    };
  } catch {
    return null;
  }
};

const getCommissionRate = (conversionType: string): number => {
  const rates = {
    quote: 0.00,
    enrollment: 0.10,
    payment: 0.05,
  };
  return rates[conversionType as keyof typeof rates] || 0;
};

export const parseUTMParams = (): Record<string, string> => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || '',
    utm_term: params.get('utm_term') || '',
  };
};

export const initializeAffiliateTracking = (): void => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref') || params.get('referral');

  if (ref) {
    const utmParams = parseUTMParams();
    trackAffiliateClick(ref, utmParams);
  }
};
