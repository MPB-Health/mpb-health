import { useState, useEffect } from 'react';
import { getAllBenefits, getMaternityMembership, Benefit, MaternityMembershipWithStages } from '../lib/benefitsService';

export function useBenefits() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBenefits() {
      try {
        setLoading(true);
        const data = await getAllBenefits();
        setBenefits(data);
      } catch (err) {
        console.warn('Benefits table may not exist yet. Run migrations first.', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch benefits'));
        setBenefits([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBenefits();
  }, []);

  return { benefits, loading, error };
}

export function useMaternityMembership() {
  const [maternityMembership, setMaternityMembership] = useState<MaternityMembershipWithStages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMaternityMembership() {
      try {
        setLoading(true);
        const data = await getMaternityMembership();
        setMaternityMembership(data);
      } catch (err) {
        console.warn('Maternity membership table may not exist yet. Run migrations first.', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch maternity membership'));
        setMaternityMembership(null);
      } finally {
        setLoading(false);
      }
    }

    fetchMaternityMembership();
  }, []);

  return { maternityMembership, loading, error };
}
