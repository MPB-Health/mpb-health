import { supabase } from './supabase';
import {
  type GoogleCredentials,
  fetchKeywordData,
  fetchPageData,
  updateSyncStatus,
  logSyncOperation,
  formatDateForApi,
  getLastNDaysRange,
} from './googleSearchConsoleService';

// ============================================================================
// Types
// ============================================================================

export interface SEOSummary {
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  totalKeywords: number;
  keywordsInTop3: number;
  keywordsInTop10: number;
  keywordsImproved: number;
  keywordsDeclined: number;
}

export interface KeywordWithTrend {
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  previousPosition: number | null;
  positionChange: number | null;
  trend: 'up' | 'down' | 'stable' | 'new';
  clicksChange: number | null;
  impressionsChange: number | null;
}

export interface PageWithMetrics {
  pageUrl: string;
  pageTitle?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
  keywordCount: number;
  topKeywords?: string[];
}

export interface RankingHistoryPoint {
  date: string;
  position: number;
  clicks: number;
  impressions: number;
}

export interface DailySEOMetrics {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

// ============================================================================
// Data Fetching from Supabase
// ============================================================================

/**
 * Get SEO summary for a date range
 */
export const getSEOSummary = async (
  siteUrl: string,
  dateRange: DateRange
): Promise<SEOSummary> => {
  // Try daily summary first
  const { data: summaryData } = await supabase
    .from('seo_daily_summary')
    .select('*')
    .eq('site_url', siteUrl)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (summaryData && summaryData.length > 0) {
    const totals = summaryData.reduce(
      (acc, day) => ({
        clicks: acc.clicks + (day.total_clicks || 0),
        impressions: acc.impressions + (day.total_impressions || 0),
        ctrSum: acc.ctrSum + (day.avg_ctr || 0),
        positionSum: acc.positionSum + (day.avg_position || 0),
        keywords: Math.max(acc.keywords, day.total_keywords || 0),
        top3: Math.max(acc.top3, day.keywords_in_top_3 || 0),
        top10: Math.max(acc.top10, day.keywords_in_top_10 || 0),
        improved: acc.improved + (day.keywords_improved || 0),
        declined: acc.declined + (day.keywords_declined || 0),
        count: acc.count + 1,
      }),
      {
        clicks: 0,
        impressions: 0,
        ctrSum: 0,
        positionSum: 0,
        keywords: 0,
        top3: 0,
        top10: 0,
        improved: 0,
        declined: 0,
        count: 0,
      }
    );

    return {
      totalClicks: totals.clicks,
      totalImpressions: totals.impressions,
      avgCtr: totals.count > 0 ? totals.ctrSum / totals.count : 0,
      avgPosition: totals.count > 0 ? totals.positionSum / totals.count : 0,
      totalKeywords: totals.keywords,
      keywordsInTop3: totals.top3,
      keywordsInTop10: totals.top10,
      keywordsImproved: totals.improved,
      keywordsDeclined: totals.declined,
    };
  }

  // Fallback to raw keyword data
  const { data: keywordData } = await supabase
    .from('seo_keywords')
    .select('*')
    .eq('site_url', siteUrl)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (!keywordData || keywordData.length === 0) {
    return {
      totalClicks: 0,
      totalImpressions: 0,
      avgCtr: 0,
      avgPosition: 0,
      totalKeywords: 0,
      keywordsInTop3: 0,
      keywordsInTop10: 0,
      keywordsImproved: 0,
      keywordsDeclined: 0,
    };
  }

  // Aggregate by keyword to get unique count
  const keywordMap = new Map<string, { clicks: number; impressions: number; position: number; count: number }>();

  keywordData.forEach((row) => {
    const existing = keywordMap.get(row.keyword) || { clicks: 0, impressions: 0, position: 0, count: 0 };
    keywordMap.set(row.keyword, {
      clicks: existing.clicks + row.clicks,
      impressions: existing.impressions + row.impressions,
      position: existing.position + row.position,
      count: existing.count + 1,
    });
  });

  let top3 = 0;
  let top10 = 0;
  let totalPosition = 0;

  keywordMap.forEach((data) => {
    const avgPos = data.position / data.count;
    totalPosition += avgPos;
    if (avgPos <= 3) top3++;
    if (avgPos <= 10) top10++;
  });

  const totalClicks = Array.from(keywordMap.values()).reduce((sum, k) => sum + k.clicks, 0);
  const totalImpressions = Array.from(keywordMap.values()).reduce((sum, k) => sum + k.impressions, 0);

  return {
    totalClicks,
    totalImpressions,
    avgCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
    avgPosition: keywordMap.size > 0 ? totalPosition / keywordMap.size : 0,
    totalKeywords: keywordMap.size,
    keywordsInTop3: top3,
    keywordsInTop10: top10,
    keywordsImproved: 0,
    keywordsDeclined: 0,
  };
};

/**
 * Get top keywords with trend data
 */
export const getTopKeywordsWithTrend = async (
  siteUrl: string,
  dateRange: DateRange,
  previousRange: DateRange,
  limit: number = 50
): Promise<KeywordWithTrend[]> => {
  // Get current period data
  const { data: currentData } = await supabase
    .from('seo_keywords')
    .select('keyword, clicks, impressions, ctr, position')
    .eq('site_url', siteUrl)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  // Get previous period data
  const { data: previousData } = await supabase
    .from('seo_keywords')
    .select('keyword, clicks, impressions, ctr, position')
    .eq('site_url', siteUrl)
    .gte('date', previousRange.startDate)
    .lte('date', previousRange.endDate);

  // Aggregate current data by keyword
  const currentMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number; count: number }>();
  currentData?.forEach((row) => {
    const existing = currentMap.get(row.keyword) || { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 };
    currentMap.set(row.keyword, {
      clicks: existing.clicks + row.clicks,
      impressions: existing.impressions + row.impressions,
      ctr: existing.ctr + row.ctr,
      position: existing.position + row.position,
      count: existing.count + 1,
    });
  });

  // Aggregate previous data by keyword
  const previousMap = new Map<string, { clicks: number; impressions: number; position: number; count: number }>();
  previousData?.forEach((row) => {
    const existing = previousMap.get(row.keyword) || { clicks: 0, impressions: 0, position: 0, count: 0 };
    previousMap.set(row.keyword, {
      clicks: existing.clicks + row.clicks,
      impressions: existing.impressions + row.impressions,
      position: existing.position + row.position,
      count: existing.count + 1,
    });
  });

  // Build result with trends
  const results: KeywordWithTrend[] = [];

  currentMap.forEach((data, keyword) => {
    const avgPosition = data.position / data.count;
    const avgCtr = data.ctr / data.count;
    const prev = previousMap.get(keyword);
    const prevAvgPosition = prev ? prev.position / prev.count : null;

    let trend: 'up' | 'down' | 'stable' | 'new' = 'new';
    let positionChange: number | null = null;

    if (prevAvgPosition !== null) {
      positionChange = avgPosition - prevAvgPosition;
      if (positionChange < -0.5) trend = 'up';
      else if (positionChange > 0.5) trend = 'down';
      else trend = 'stable';
    }

    results.push({
      keyword,
      clicks: data.clicks,
      impressions: data.impressions,
      ctr: avgCtr,
      position: avgPosition,
      previousPosition: prevAvgPosition,
      positionChange,
      trend,
      clicksChange: prev ? data.clicks - prev.clicks : null,
      impressionsChange: prev ? data.impressions - prev.impressions : null,
    });
  });

  // Sort by clicks (most traffic first)
  return results.sort((a, b) => b.clicks - a.clicks).slice(0, limit);
};

/**
 * Get trending keywords (improving or declining)
 */
export const getTrendingKeywords = async (
  siteUrl: string,
  direction: 'up' | 'down',
  limit: number = 10
): Promise<KeywordWithTrend[]> => {
  const { data } = await supabase
    .from('seo_keyword_rankings')
    .select('*')
    .eq('site_url', siteUrl)
    .eq('trend', direction)
    .order('position_change', { ascending: direction === 'up' })
    .limit(limit);

  if (!data) return [];

  return data.map((row) => ({
    keyword: row.keyword,
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: 0,
    position: row.position,
    previousPosition: row.previous_position,
    positionChange: row.position_change,
    trend: row.trend as 'up' | 'down' | 'stable' | 'new',
    clicksChange: null,
    impressionsChange: null,
  }));
};

/**
 * Get keyword ranking history
 */
export const getKeywordRankingHistory = async (
  siteUrl: string,
  keyword: string,
  days: number = 30
): Promise<RankingHistoryPoint[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from('seo_keyword_rankings')
    .select('date, position, clicks, impressions')
    .eq('site_url', siteUrl)
    .eq('keyword', keyword)
    .gte('date', formatDateForApi(startDate))
    .order('date', { ascending: true });

  if (!data) return [];

  return data.map((row) => ({
    date: row.date,
    position: row.position,
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
  }));
};

/**
 * Get multiple keywords ranking history for comparison
 */
export const getKeywordsRankingComparison = async (
  siteUrl: string,
  keywords: string[],
  days: number = 30
): Promise<Map<string, RankingHistoryPoint[]>> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from('seo_keyword_rankings')
    .select('keyword, date, position, clicks, impressions')
    .eq('site_url', siteUrl)
    .in('keyword', keywords)
    .gte('date', formatDateForApi(startDate))
    .order('date', { ascending: true });

  const result = new Map<string, RankingHistoryPoint[]>();
  keywords.forEach((k) => result.set(k, []));

  data?.forEach((row) => {
    const history = result.get(row.keyword) || [];
    history.push({
      date: row.date,
      position: row.position,
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
    });
    result.set(row.keyword, history);
  });

  return result;
};

/**
 * Get top pages with metrics
 */
export const getTopPagesWithMetrics = async (
  siteUrl: string,
  dateRange: DateRange,
  limit: number = 20
): Promise<PageWithMetrics[]> => {
  const { data } = await supabase
    .from('seo_pages')
    .select('*')
    .eq('site_url', siteUrl)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate);

  if (!data) return [];

  // Aggregate by page URL
  const pageMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number; count: number; keywordCount: number }>();

  data.forEach((row) => {
    const existing = pageMap.get(row.page_url) || { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0, keywordCount: 0 };
    pageMap.set(row.page_url, {
      clicks: existing.clicks + row.clicks,
      impressions: existing.impressions + row.impressions,
      ctr: existing.ctr + row.ctr,
      position: existing.position + row.avg_position,
      count: existing.count + 1,
      keywordCount: Math.max(existing.keywordCount, row.keyword_count || 0),
    });
  });

  const results: PageWithMetrics[] = [];

  pageMap.forEach((data, pageUrl) => {
    results.push({
      pageUrl,
      clicks: data.clicks,
      impressions: data.impressions,
      ctr: data.ctr / data.count,
      avgPosition: data.position / data.count,
      keywordCount: data.keywordCount,
    });
  });

  return results.sort((a, b) => b.clicks - a.clicks).slice(0, limit);
};

/**
 * Get daily SEO metrics for trend chart
 */
export const getDailySEOMetrics = async (
  siteUrl: string,
  dateRange: DateRange
): Promise<DailySEOMetrics[]> => {
  const { data } = await supabase
    .from('seo_daily_summary')
    .select('date, total_clicks, total_impressions, avg_ctr, avg_position')
    .eq('site_url', siteUrl)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate)
    .order('date', { ascending: true });

  if (!data) return [];

  return data.map((row) => ({
    date: row.date,
    clicks: row.total_clicks,
    impressions: row.total_impressions,
    ctr: row.avg_ctr,
    avgPosition: row.avg_position,
  }));
};

// ============================================================================
// Data Sync Functions
// ============================================================================

/**
 * Sync keyword data from Google Search Console
 */
export const syncKeywordData = async (
  credentials: GoogleCredentials,
  dateRange: DateRange
): Promise<{ inserted: number; updated: number }> => {
  const startTime = Date.now();

  try {
    await updateSyncStatus(credentials.site_url, 'syncing');
    await logSyncOperation(credentials.site_url, 'keywords', 'started', {
      dateFrom: dateRange.startDate,
      dateTo: dateRange.endDate,
      startedAt: new Date().toISOString(),
    });

    // Fetch data from GSC
    const keywordData = await fetchKeywordData(credentials, dateRange.startDate, dateRange.endDate, {
      includePages: true,
      limit: 10000,
    });

    if (keywordData.length === 0) {
      await updateSyncStatus(credentials.site_url, 'success');
      await logSyncOperation(credentials.site_url, 'keywords', 'completed', {
        recordsFetched: 0,
        recordsInserted: 0,
        dateFrom: dateRange.startDate,
        dateTo: dateRange.endDate,
        durationMs: Date.now() - startTime,
      });
      return { inserted: 0, updated: 0 };
    }

    // Prepare data for upsert
    const keywordRecords = keywordData.map((kw) => ({
      site_url: credentials.site_url,
      keyword: kw.keyword,
      page_url: kw.pageUrl,
      date: kw.date,
      clicks: kw.clicks,
      impressions: kw.impressions,
      ctr: kw.ctr,
      position: kw.position,
    }));

    // Batch upsert
    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < keywordRecords.length; i += batchSize) {
      const batch = keywordRecords.slice(i, i + batchSize);
      const { error } = await supabase.from('seo_keywords').upsert(batch, {
        onConflict: 'site_url,keyword,date',
      });

      if (error) {
        console.error('Error upserting keywords:', error);
      } else {
        inserted += batch.length;
      }
    }

    // Update ranking tracking
    await updateKeywordRankings(credentials.site_url, keywordData);

    await updateSyncStatus(credentials.site_url, 'success');
    await logSyncOperation(credentials.site_url, 'keywords', 'completed', {
      recordsFetched: keywordData.length,
      recordsInserted: inserted,
      dateFrom: dateRange.startDate,
      dateTo: dateRange.endDate,
      durationMs: Date.now() - startTime,
    });

    return { inserted, updated: 0 };
  } catch (error: any) {
    await updateSyncStatus(credentials.site_url, 'error', error.message);
    await logSyncOperation(credentials.site_url, 'keywords', 'failed', {
      error: error.message,
      dateFrom: dateRange.startDate,
      dateTo: dateRange.endDate,
      durationMs: Date.now() - startTime,
    });
    throw error;
  }
};

/**
 * Sync page data from Google Search Console
 */
export const syncPageData = async (
  credentials: GoogleCredentials,
  dateRange: DateRange
): Promise<{ inserted: number }> => {
  const pageData = await fetchPageData(credentials, dateRange.startDate, dateRange.endDate, 1000);

  if (pageData.length === 0) {
    return { inserted: 0 };
  }

  const pageRecords = pageData.map((page) => ({
    site_url: credentials.site_url,
    page_url: page.pageUrl,
    date: page.date,
    clicks: page.clicks,
    impressions: page.impressions,
    ctr: page.ctr,
    avg_position: page.avgPosition,
  }));

  const { error } = await supabase.from('seo_pages').upsert(pageRecords, {
    onConflict: 'site_url,page_url,date',
  });

  if (error) {
    console.error('Error upserting pages:', error);
    throw error;
  }

  return { inserted: pageRecords.length };
};

/**
 * Update keyword rankings with trend data
 */
const updateKeywordRankings = async (
  siteUrl: string,
  keywordData: Array<{ keyword: string; date: string; position: number; clicks: number; impressions: number }>
): Promise<void> => {
  // Group by keyword and date
  const rankingMap = new Map<string, Map<string, { position: number; clicks: number; impressions: number }>>();

  keywordData.forEach((kw) => {
    if (!rankingMap.has(kw.keyword)) {
      rankingMap.set(kw.keyword, new Map());
    }
    const dateMap = rankingMap.get(kw.keyword)!;
    const existing = dateMap.get(kw.date) || { position: 0, clicks: 0, impressions: 0 };
    dateMap.set(kw.date, {
      position: existing.position ? (existing.position + kw.position) / 2 : kw.position,
      clicks: existing.clicks + kw.clicks,
      impressions: existing.impressions + kw.impressions,
    });
  });

  const rankingRecords: Array<{
    site_url: string;
    keyword: string;
    date: string;
    position: number;
    clicks: number;
    impressions: number;
  }> = [];

  rankingMap.forEach((dateMap, keyword) => {
    dateMap.forEach((data, date) => {
      rankingRecords.push({
        site_url: siteUrl,
        keyword,
        date,
        position: data.position,
        clicks: data.clicks,
        impressions: data.impressions,
      });
    });
  });

  // Batch upsert rankings
  const batchSize = 500;
  for (let i = 0; i < rankingRecords.length; i += batchSize) {
    const batch = rankingRecords.slice(i, i + batchSize);
    await supabase.from('seo_keyword_rankings').upsert(batch, {
      onConflict: 'site_url,keyword,date',
    });
  }
};

/**
 * Update daily summary
 */
export const updateDailySummary = async (
  siteUrl: string,
  date: string
): Promise<void> => {
  // Get keyword data for the day
  const { data: keywordData } = await supabase
    .from('seo_keywords')
    .select('*')
    .eq('site_url', siteUrl)
    .eq('date', date);

  if (!keywordData || keywordData.length === 0) {
    return;
  }

  // Calculate summary
  const uniqueKeywords = new Set(keywordData.map((k) => k.keyword));
  const totalClicks = keywordData.reduce((sum, k) => sum + k.clicks, 0);
  const totalImpressions = keywordData.reduce((sum, k) => sum + k.impressions, 0);
  const avgPosition = keywordData.reduce((sum, k) => sum + k.position, 0) / keywordData.length;

  let top3 = 0;
  let top10 = 0;
  let top20 = 0;

  uniqueKeywords.forEach((keyword) => {
    const kwData = keywordData.filter((k) => k.keyword === keyword);
    const avgPos = kwData.reduce((sum, k) => sum + k.position, 0) / kwData.length;
    if (avgPos <= 3) top3++;
    if (avgPos <= 10) top10++;
    if (avgPos <= 20) top20++;
  });

  // Get ranking changes
  const { data: rankings } = await supabase
    .from('seo_keyword_rankings')
    .select('trend')
    .eq('site_url', siteUrl)
    .eq('date', date);

  const improved = rankings?.filter((r) => r.trend === 'up').length || 0;
  const declined = rankings?.filter((r) => r.trend === 'down').length || 0;

  // Upsert summary
  await supabase.from('seo_daily_summary').upsert(
    {
      site_url: siteUrl,
      date,
      total_clicks: totalClicks,
      total_impressions: totalImpressions,
      avg_ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
      avg_position: avgPosition,
      total_keywords: uniqueKeywords.size,
      keywords_in_top_3: top3,
      keywords_in_top_10: top10,
      keywords_in_top_20: top20,
      keywords_improved: improved,
      keywords_declined: declined,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'site_url,date' }
  );
};

/**
 * Full sync for a site
 */
export const fullSync = async (
  credentials: GoogleCredentials,
  days: number = 28
): Promise<{ keywords: number; pages: number }> => {
  const dateRange = getLastNDaysRange(days);

  const keywordResult = await syncKeywordData(credentials, dateRange);
  const pageResult = await syncPageData(credentials, dateRange);

  // Update daily summaries for each day
  const startDate = new Date(dateRange.startDate);
  const endDate = new Date(dateRange.endDate);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    await updateDailySummary(credentials.site_url, formatDateForApi(d));
  }

  return {
    keywords: keywordResult.inserted,
    pages: pageResult.inserted,
  };
};

