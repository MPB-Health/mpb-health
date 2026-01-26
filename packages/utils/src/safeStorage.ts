import { safeJsonParse, safeJsonStringify } from './safeJson';

interface StorageWrapper {
  getItem<T = string>(key: string, defaultValue?: T): T | null;
  setItem(key: string, value: unknown): boolean;
  removeItem(key: string): boolean;
  clear(): boolean;
  hasItem(key: string): boolean;
}

function createStorageWrapper(storage: Storage | null): StorageWrapper {
  return {
    getItem<T = string>(key: string, defaultValue?: T): T | null {
      if (!storage) return defaultValue ?? null;

      try {
        const item = storage.getItem(key);
        if (item === null) return defaultValue ?? null;

        // Try to parse as JSON, fall back to raw string
        const parsed = safeJsonParse<T>(item);
        return parsed !== undefined ? parsed : (item as unknown as T);
      } catch {
        return defaultValue ?? null;
      }
    },

    setItem(key: string, value: unknown): boolean {
      if (!storage) return false;

      try {
        const stringValue =
          typeof value === 'string' ? value : safeJsonStringify(value) ?? '';
        storage.setItem(key, stringValue);
        return true;
      } catch {
        return false;
      }
    },

    removeItem(key: string): boolean {
      if (!storage) return false;

      try {
        storage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },

    clear(): boolean {
      if (!storage) return false;

      try {
        storage.clear();
        return true;
      } catch {
        return false;
      }
    },

    hasItem(key: string): boolean {
      if (!storage) return false;

      try {
        return storage.getItem(key) !== null;
      } catch {
        return false;
      }
    },
  };
}

/**
 * Safe localStorage wrapper that handles SSR and quota errors
 */
export const safeLocalStorage: StorageWrapper = createStorageWrapper(
  typeof window !== 'undefined' ? window.localStorage : null
);

/**
 * Safe sessionStorage wrapper that handles SSR and quota errors
 */
export const safeSessionStorage: StorageWrapper = createStorageWrapper(
  typeof window !== 'undefined' ? window.sessionStorage : null
);
