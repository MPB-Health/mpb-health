import { useState, useCallback, useRef, type ChangeEvent, type FormEvent } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => Promise<void>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  loading: boolean;
  submitError: string | null;
  submitCount: number;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent) => void;
  retry: () => void;
  setFieldValue: (field: keyof T, value: unknown) => void;
  setValues: (updater: T | ((prev: T) => T)) => void;
  reset: (newValues?: T) => void;
  isDirty: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const { initialValues, validate, onSubmit } = options;
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitCount, setSubmitCount] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const lastSubmitRef = useRef<FormEvent | null>(null);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const newValue =
        type === 'checkbox' ? (e.target as HTMLInputElement).checked :
        type === 'number' ? (value === '' ? '' : Number(value)) :
        value;
      setValuesState((prev) => ({ ...prev, [name]: newValue }));
      setIsDirty(true);
      setErrors((prev) => {
        if (prev[name as keyof T]) {
          const next = { ...prev };
          delete next[name as keyof T];
          return next;
        }
        return prev;
      });
      if (submitError) setSubmitError(null);
    },
    [submitError]
  );

  const setFieldValue = useCallback((field: keyof T, value: unknown) => {
    setValuesState((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setErrors((prev) => {
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
  }, []);

  const setValues = useCallback((updater: T | ((prev: T) => T)) => {
    setValuesState(updater as T);
    setIsDirty(true);
  }, []);

  const executeSubmit = useCallback(
    async () => {
      if (loading) return;

      if (validate) {
        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }

      setErrors({});
      setSubmitError(null);
      setLoading(true);
      setSubmitCount((c) => c + 1);

      try {
        await onSubmit(values);
        setIsDirty(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setSubmitError(message);
      } finally {
        setLoading(false);
      }
    },
    [values, loading, validate, onSubmit]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      lastSubmitRef.current = e;
      await executeSubmit();
    },
    [executeSubmit]
  );

  const retry = useCallback(() => {
    setSubmitError(null);
    executeSubmit();
  }, [executeSubmit]);

  const reset = useCallback((newValues?: T) => {
    setValuesState(newValues ?? initialValues);
    setErrors({});
    setLoading(false);
    setSubmitError(null);
    setIsDirty(false);
  }, [initialValues]);

  return {
    values,
    errors,
    loading,
    submitError,
    submitCount,
    handleChange,
    handleSubmit,
    retry,
    setFieldValue,
    setValues,
    reset,
    isDirty,
  };
}
