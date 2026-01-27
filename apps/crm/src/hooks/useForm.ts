import { useState, useCallback, type ChangeEvent, type FormEvent } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => Promise<void>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  loading: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent) => void;
  setFieldValue: (field: keyof T, value: unknown) => void;
  reset: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const { initialValues, validate, onSubmit } = options;
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const newValue =
        type === 'checkbox' ? (e.target as HTMLInputElement).checked :
        type === 'number' ? (value === '' ? '' : Number(value)) :
        value;
      setValues((prev) => ({ ...prev, [name]: newValue }));
      // Clear field error on change
      setErrors((prev) => {
        if (prev[name as keyof T]) {
          const next = { ...prev };
          delete next[name as keyof T];
          return next;
        }
        return prev;
      });
    },
    []
  );

  const setFieldValue = useCallback((field: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (loading) return;

      // Run validation
      if (validate) {
        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }

      setErrors({});
      setLoading(true);
      try {
        await onSubmit(values);
      } catch (err) {
        // Let caller handle via toast; re-throw so they can catch
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [values, loading, validate, onSubmit]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setLoading(false);
  }, [initialValues]);

  return { values, errors, loading, handleChange, handleSubmit, setFieldValue, reset };
}
