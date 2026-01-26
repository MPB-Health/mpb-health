import { useState, useEffect } from 'react';
import { getAllAdvisors, getAdvisorsByState, Advisor } from '../lib/advisorsService';

export function useAdvisors() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAdvisors() {
      try {
        setLoading(true);
        const data = await getAllAdvisors();
        setAdvisors(data);
      } catch (err) {
        console.warn('Advisors table may not exist yet. Run migrations first.', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch advisors'));
        setAdvisors([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAdvisors();
  }, []);

  return { advisors, loading, error };
}

export function useAdvisorsByState(state: string) {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAdvisors() {
      try {
        setLoading(true);
        const data = await getAdvisorsByState(state);
        setAdvisors(data);
      } catch (err) {
        console.warn('Advisors table may not exist yet. Run migrations first.', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch advisors'));
        setAdvisors([]);
      } finally {
        setLoading(false);
      }
    }

    if (state) {
      fetchAdvisors();
    }
  }, [state]);

  return { advisors, loading, error };
}
