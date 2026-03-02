import { supabase } from './supabase';

// ============================================================================
// Types
// ============================================================================

export interface GoogleCredentials {
  id: string;
  site_url: string;
  site_name: string | null;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  is_connected: boolean;
  last_sync_at: string | null;
  sync_status: 'idle' | 'syncing' | 'success' | 'error';
  sync_error: string | null;
}

export interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchAnalyticsResponse {
  rows?: SearchAnalyticsRow[];
  responseAggregationType?: string;
}

export interface KeywordData {
  keyword: string;
  pageUrl?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  date: string;
  device?: string;
  country?: string;
}

export interface PageData {
  pageUrl: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
  date: string;
}

// ============================================================================
// Configuration
// ============================================================================

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
// GOOGLE_CLIENT_SECRET is server-side only — stored in Supabase Edge Function secrets.
// Do NOT reference VITE_GOOGLE_CLIENT_SECRET here.
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/admin/seo/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/webmasters',
];

const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3';
const SEARCH_ANALYTICS_API = 'https://searchconsole.googleapis.com/webmasters/v3';

// ============================================================================
// OAuth Functions
// ============================================================================

/**
 * Generate OAuth URL for Google Search Console authorization
 */
export const getGoogleAuthUrl = (state?: string): string => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state }),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Exchange authorization code for tokens
 */
export const exchangeCodeForTokens = async (
  code: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> => {
  const { data, error } = await supabase.functions.invoke('google-oauth-exchange', {
    body: { action: 'exchange_code', code, redirect_uri: GOOGLE_REDIRECT_URI },
  });

  if (error || !data?.access_token) {
    throw new Error(error?.message || data?.error || 'Failed to exchange code for tokens');
  }

  return data;
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> => {
  const { data, error } = await supabase.functions.invoke('google-oauth-exchange', {
    body: { action: 'refresh_token', refresh_token: refreshToken },
  });

  if (error || !data?.access_token) {
    throw new Error(error?.message || data?.error || 'Failed to refresh token');
  }

  return data;
};

// ============================================================================
// Credential Management
// ============================================================================

/**
 * Get stored credentials for a site
 */
export const getCredentials = async (siteUrl?: string): Promise<GoogleCredentials | null> => {
  let query = supabase.from('seo_google_credentials').select('*');

  if (siteUrl) {
    query = query.eq('site_url', siteUrl);
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as GoogleCredentials;
};

/**
 * Get all connected sites
 */
export const getConnectedSites = async (): Promise<GoogleCredentials[]> => {
  const { data, error } = await supabase
    .from('seo_google_credentials')
    .select('*')
    .eq('is_connected', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching connected sites:', error);
    return [];
  }

  return data as GoogleCredentials[];
};

/**
 * Save or update credentials
 */
export const saveCredentials = async (
  siteUrl: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  siteName?: string
): Promise<GoogleCredentials> => {
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  const { data, error } = await supabase
    .from('seo_google_credentials')
    .upsert(
      {
        site_url: siteUrl,
        site_name: siteName,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        is_connected: true,
        sync_status: 'idle',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'site_url' }
    )
    .select()
    .single();

  if (error) {
    throw new Error('Failed to save credentials');
  }

  return data as GoogleCredentials;
};

/**
 * Disconnect a site
 */
export const disconnectSite = async (siteUrl: string): Promise<void> => {
  const { error } = await supabase
    .from('seo_google_credentials')
    .update({ is_connected: false })
    .eq('site_url', siteUrl);

  if (error) {
    throw new Error('Failed to disconnect site');
  }
};

/**
 * Ensure we have a valid access token (refresh if needed)
 */
export const ensureValidToken = async (credentials: GoogleCredentials): Promise<string> => {
  const expiresAt = new Date(credentials.expires_at);
  const now = new Date();

  // If token expires in less than 5 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    try {
      const { access_token, expires_in } = await refreshAccessToken(credentials.refresh_token);

      // Update stored credentials
      await saveCredentials(
        credentials.site_url,
        access_token,
        credentials.refresh_token,
        expires_in,
        credentials.site_name || undefined
      );

      return access_token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  }

  return credentials.access_token;
};

// ============================================================================
// Search Console API Functions
// ============================================================================

/**
 * Get list of sites from Search Console
 */
export const getSites = async (accessToken: string): Promise<Array<{ siteUrl: string; permissionLevel: string }>> => {
  const response = await fetch(`${GSC_API_BASE}/sites`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch sites');
  }

  const data = await response.json();
  return data.siteEntry || [];
};

/**
 * Query Search Analytics data
 */
export const querySearchAnalytics = async (
  accessToken: string,
  siteUrl: string,
  options: {
    startDate: string;
    endDate: string;
    dimensions?: ('query' | 'page' | 'date' | 'country' | 'device')[];
    rowLimit?: number;
    startRow?: number;
    dimensionFilterGroups?: any[];
  }
): Promise<SearchAnalyticsResponse> => {
  const encodedSiteUrl = encodeURIComponent(siteUrl);

  const body = {
    startDate: options.startDate,
    endDate: options.endDate,
    dimensions: options.dimensions || ['query'],
    rowLimit: options.rowLimit || 1000,
    startRow: options.startRow || 0,
    ...(options.dimensionFilterGroups && { dimensionFilterGroups: options.dimensionFilterGroups }),
  };

  const response = await fetch(
    `${SEARCH_ANALYTICS_API}/sites/${encodedSiteUrl}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to query search analytics');
  }

  return response.json();
};

/**
 * Fetch keyword data for a date range
 */
export const fetchKeywordData = async (
  credentials: GoogleCredentials,
  startDate: string,
  endDate: string,
  options?: {
    includePages?: boolean;
    limit?: number;
  }
): Promise<KeywordData[]> => {
  const accessToken = await ensureValidToken(credentials);

  const dimensions: ('query' | 'page' | 'date')[] = ['query', 'date'];
  if (options?.includePages) {
    dimensions.push('page');
  }

  const response = await querySearchAnalytics(accessToken, credentials.site_url, {
    startDate,
    endDate,
    dimensions,
    rowLimit: options?.limit || 5000,
  });

  if (!response.rows) {
    return [];
  }

  return response.rows.map((row) => ({
    keyword: row.keys[0],
    date: row.keys[1],
    pageUrl: options?.includePages ? row.keys[2] : undefined,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }));
};

/**
 * Fetch page-level data for a date range
 */
export const fetchPageData = async (
  credentials: GoogleCredentials,
  startDate: string,
  endDate: string,
  limit?: number
): Promise<PageData[]> => {
  const accessToken = await ensureValidToken(credentials);

  const response = await querySearchAnalytics(accessToken, credentials.site_url, {
    startDate,
    endDate,
    dimensions: ['page', 'date'],
    rowLimit: limit || 1000,
  });

  if (!response.rows) {
    return [];
  }

  return response.rows.map((row) => ({
    pageUrl: row.keys[0],
    date: row.keys[1],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    avgPosition: row.position,
  }));
};

/**
 * Fetch top keywords aggregated (no date dimension)
 */
export const fetchTopKeywords = async (
  credentials: GoogleCredentials,
  startDate: string,
  endDate: string,
  limit: number = 100
): Promise<Array<{
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}>> => {
  const accessToken = await ensureValidToken(credentials);

  const response = await querySearchAnalytics(accessToken, credentials.site_url, {
    startDate,
    endDate,
    dimensions: ['query'],
    rowLimit: limit,
  });

  if (!response.rows) {
    return [];
  }

  return response.rows.map((row) => ({
    keyword: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }));
};

/**
 * Fetch top pages aggregated (no date dimension)
 */
export const fetchTopPages = async (
  credentials: GoogleCredentials,
  startDate: string,
  endDate: string,
  limit: number = 50
): Promise<Array<{
  pageUrl: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
}>> => {
  const accessToken = await ensureValidToken(credentials);

  const response = await querySearchAnalytics(accessToken, credentials.site_url, {
    startDate,
    endDate,
    dimensions: ['page'],
    rowLimit: limit,
  });

  if (!response.rows) {
    return [];
  }

  return response.rows.map((row) => ({
    pageUrl: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    avgPosition: row.position,
  }));
};

// ============================================================================
// Sync Functions
// ============================================================================

/**
 * Update sync status
 */
export const updateSyncStatus = async (
  siteUrl: string,
  status: 'idle' | 'syncing' | 'success' | 'error',
  error?: string
): Promise<void> => {
  await supabase
    .from('seo_google_credentials')
    .update({
      sync_status: status,
      sync_error: error || null,
      ...(status === 'success' && { last_sync_at: new Date().toISOString() }),
      updated_at: new Date().toISOString(),
    })
    .eq('site_url', siteUrl);
};

/**
 * Log sync operation
 */
export const logSyncOperation = async (
  siteUrl: string,
  syncType: 'keywords' | 'pages' | 'full',
  status: 'started' | 'completed' | 'failed',
  details: {
    recordsFetched?: number;
    recordsInserted?: number;
    recordsUpdated?: number;
    dateFrom?: string;
    dateTo?: string;
    error?: string;
    errorDetails?: any;
    startedAt?: string;
    durationMs?: number;
  }
): Promise<void> => {
  await supabase.from('seo_sync_logs').insert({
    site_url: siteUrl,
    sync_type: syncType,
    status,
    records_fetched: details.recordsFetched || 0,
    records_inserted: details.recordsInserted || 0,
    records_updated: details.recordsUpdated || 0,
    date_from: details.dateFrom,
    date_to: details.dateTo,
    error_message: details.error,
    error_details: details.errorDetails,
    started_at: details.startedAt,
    completed_at: status !== 'started' ? new Date().toISOString() : null,
    duration_ms: details.durationMs,
  });
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if Google API is configured
 */
export const isGoogleApiConfigured = (): boolean => {
  // Client secret is server-side; only check for client ID here
  return Boolean(GOOGLE_CLIENT_ID);
};

/**
 * Format site URL for display
 */
export const formatSiteUrl = (siteUrl: string): string => {
  try {
    const url = new URL(siteUrl);
    return url.hostname;
  } catch {
    return siteUrl.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
  }
};

/**
 * Get date string for API (YYYY-MM-DD)
 */
export const formatDateForApi = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Get date range for last N days
 */
export const getLastNDaysRange = (days: number): { startDate: string; endDate: string } => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1); // Yesterday (GSC data has ~2 day delay)

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate: formatDateForApi(startDate),
    endDate: formatDateForApi(endDate),
  };
};

