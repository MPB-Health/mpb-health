import { useState, useEffect } from 'react';
import { getAllFAQItems, getFAQItemsByCategory, FAQItem } from '../lib/faqService';

export function useFAQ() {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchFAQ() {
      try {
        setLoading(true);
        const data = await getAllFAQItems();
        setFaqItems(data);
      } catch (err) {
        console.warn('FAQ items table may not exist yet. Run migrations first.', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch FAQ items'));
        setFaqItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFAQ();
  }, []);

  return { faqItems, loading, error };
}

export function useFAQByCategory(category: string) {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchFAQ() {
      try {
        setLoading(true);
        const data = await getFAQItemsByCategory(category);
        setFaqItems(data);
      } catch (err) {
        console.warn('FAQ items table may not exist yet. Run migrations first.', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch FAQ items'));
        setFaqItems([]);
      } finally {
        setLoading(false);
      }
    }

    if (category) {
      fetchFAQ();
    }
  }, [category]);

  return { faqItems, loading, error };
}
