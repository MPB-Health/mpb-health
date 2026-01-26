import { useState, useEffect, useCallback } from 'react';
import { supabase, Resource, ResourceFilters, ResourceTopic, isSupabaseConfigured } from '../lib/supabase';

interface UseResourcesResult {
  resources: Resource[];
  topics: ResourceTopic[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => void;
}

const getErrorMessage = (err: unknown): string => {
  if (err && typeof err === 'object') {
    const error = err as { message?: string; code?: string; hint?: string; details?: string };

    if (error.code === 'PGRST301') {
      return 'Authentication configuration error. Please check your Supabase credentials.';
    }

    if (error.message?.includes('JWT') || error.message?.includes('authentication')) {
      return 'Unable to authenticate with the database. Please verify your connection settings.';
    }

    if (error.hint) {
      return `${error.message || 'Database error'}: ${error.hint}`;
    }

    return error.message || 'An unexpected error occurred.';
  }

  return 'Failed to load resources. Please try again.';
};

export const useResources = (filters: ResourceFilters): UseResourcesResult => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [topics, setTopics] = useState<ResourceTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTopics = useCallback(async () => {
    if (!isSupabaseConfigured) {
      console.error('[useResources] Supabase is not configured');
      return;
    }

    try {
      const { data, error: topicsError } = await supabase
        .from('resource_topics')
        .select('*')
        .order('name');

      if (topicsError) {
        console.error('[useResources] Topics error:', topicsError);
        throw topicsError;
      }

      if (data) {
        console.log('[useResources] Successfully loaded', data.length, 'topics');
        setTopics(data);
      }
    } catch (err) {
      console.error('[useResources] Error fetching topics:', err);
    }
  }, []);

  const fetchResources = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('Database connection not configured. Please contact support.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useResources] Fetching resources with filters:', filters);

      let query = supabase
        .from('resource_library')
        .select('*', { count: 'exact' })
        .eq('is_published', true);

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.types.length > 0) {
        query = query.in('resource_type', filters.types);
      }

      if (filters.audiences.length > 0) {
        query = query.in('target_audience', filters.audiences);
      }

      if (filters.topics.length > 0) {
        query = query.overlaps('topics', filters.topics);
      }

      switch (filters.sortBy) {
        case 'newest':
          query = query.order('published_date', { ascending: false });
          break;
        case 'oldest':
          query = query.order('published_date', { ascending: true });
          break;
        case 'most-viewed':
          query = query.order('view_count', { ascending: false });
          break;
        case 'title-asc':
          query = query.order('title', { ascending: true });
          break;
        case 'title-desc':
          query = query.order('title', { ascending: false });
          break;
        default:
          query = query.order('published_date', { ascending: false });
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        console.error('[useResources] Fetch error:', fetchError);
        throw fetchError;
      }

      if (data) {
        console.log('[useResources] Successfully loaded', data.length, 'resources');
        setResources(data);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error('[useResources] Error fetching resources:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return {
    resources,
    topics,
    loading,
    error,
    totalCount,
    refetch: fetchResources,
  };
};

export const useResourceDetail = (slug: string) => {
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResource = async () => {
      if (!isSupabaseConfigured) {
        setError('Database connection not configured. Please contact support.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('[useResourceDetail] Fetching resource:', slug);

        const { data, error: fetchError } = await supabase
          .from('resource_library')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .maybeSingle();

        if (fetchError) {
          console.error('[useResourceDetail] Fetch error:', fetchError);
          throw fetchError;
        }

        if (data) {
          console.log('[useResourceDetail] Successfully loaded resource:', data.title);
          setResource(data);

          await supabase
            .from('resource_library')
            .update({ view_count: data.view_count + 1 })
            .eq('id', data.id);
        }
      } catch (err) {
        console.error('[useResourceDetail] Error fetching resource:', err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchResource();
    }
  }, [slug]);

  return { resource, loading, error };
};

export const incrementDownloadCount = async (resourceId: string) => {
  try {
    const { data } = await supabase
      .from('resource_library')
      .select('download_count')
      .eq('id', resourceId)
      .single();

    if (data) {
      await supabase
        .from('resource_library')
        .update({ download_count: data.download_count + 1 })
        .eq('id', resourceId);
    }
  } catch (err) {
    console.error('Error incrementing download count:', err);
  }
};
