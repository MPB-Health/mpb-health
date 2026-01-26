import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../client';

interface UseSupabaseQueryOptions<T> {
  /** Table name to query */
  table: string;
  /** Columns to select (default: '*') */
  select?: string;
  /** Filter function to apply to the query */
  filter?: (query: any) => any;
  /** Whether to fetch immediately (default: true) */
  immediate?: boolean;
  /** Dependencies that trigger a refetch when changed */
  deps?: any[];
  /** Transform function to apply to results */
  transform?: (data: any[]) => T[];
  /** Single result mode */
  single?: boolean;
}

interface UseSupabaseQueryReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSupabaseQuery<T = any>(
  options: UseSupabaseQueryOptions<T>
): UseSupabaseQueryReturn<T[]>;

export function useSupabaseQuery<T = any>(
  options: UseSupabaseQueryOptions<T> & { single: true }
): UseSupabaseQueryReturn<T | null>;

export function useSupabaseQuery<T = any>(
  options: UseSupabaseQueryOptions<T>
): UseSupabaseQueryReturn<T[] | T | null> {
  const {
    table,
    select = '*',
    filter,
    immediate = true,
    deps = [],
    transform,
    single = false,
  } = options;

  const [data, setData] = useState<T[] | T | null>(single ? null : []);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table).select(select);

      if (filter) {
        query = filter(query);
      }

      const { data: result, error: queryError } = single
        ? await query.maybeSingle()
        : await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      if (single) {
        setData(result as T | null);
      } else {
        const resultArray = (result || []) as any[];
        const transformedData = transform ? transform(resultArray) : (resultArray as T[]);
        setData(transformedData);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(single ? null : []);
    } finally {
      setLoading(false);
    }
  }, [table, select, filter, transform, single]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, fetchData, ...deps]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// Convenience hook for paginated queries
interface UsePaginatedQueryOptions<T> extends Omit<UseSupabaseQueryOptions<T>, 'single'> {
  pageSize?: number;
  initialPage?: number;
}

interface UsePaginatedQueryReturn<T> extends UseSupabaseQueryReturn<T[]> {
  page: number;
  pageSize: number;
  totalCount: number | null;
  hasMore: boolean;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export function usePaginatedQuery<T = any>(
  options: UsePaginatedQueryOptions<T>
): UsePaginatedQueryReturn<T> {
  const {
    table,
    select = '*',
    filter,
    immediate = true,
    deps = [],
    transform,
    pageSize = 20,
    initialPage = 0,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from(table)
        .select(select, { count: 'exact' })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filter) {
        query = filter(query);
      }

      const { data: result, error: queryError, count } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      const transformedData = transform ? transform(result || []) : (result as T[]);
      setData(transformedData);
      setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [table, select, filter, transform, page, pageSize]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, fetchData, ...deps]);

  const hasMore = totalCount !== null && (page + 1) * pageSize < totalCount;

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    page,
    pageSize,
    totalCount,
    hasMore,
    nextPage: () => setPage((p) => p + 1),
    prevPage: () => setPage((p) => Math.max(0, p - 1)),
    goToPage: setPage,
  };
}
