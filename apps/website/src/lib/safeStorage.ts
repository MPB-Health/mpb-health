import { safeJsonParse, safeJsonStringify } from './safeJson';
import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('SafeStorage');

export interface StorageOptions {
  ttl?: number;
  version?: number;
}

interface StorageItem<T> {
  value: T;
  version: number;
  timestamp: number;
  ttl?: number;
}

const STORAGE_VERSION = 1;

export class SafeStorage {
  private storage: Storage;
  private storageAvailable: boolean;

  constructor(storage: Storage = localStorage) {
    this.storage = storage;
    this.storageAvailable = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    try {
      const test = '__storage_test__';
      this.storage.setItem(test, test);
      this.storage.removeItem(test);
      return true;
    } catch {
      console.warn('[SafeStorage] Storage not available');
      return false;
    }
  }

  setItem<T>(key: string, value: T, options: StorageOptions = {}): boolean {
    if (!this.storageAvailable) {
      return false;
    }

    try {
      const item: StorageItem<T> = {
        value,
        version: options.version ?? STORAGE_VERSION,
        timestamp: Date.now(),
        ttl: options.ttl,
      };

      const serialized = safeJsonStringify(item);
      this.storage.setItem(key, serialized);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('[SafeStorage] Quota exceeded, attempting cleanup');
        this.cleanup();

        try {
          const item: StorageItem<T> = {
            value,
            version: options.version ?? STORAGE_VERSION,
            timestamp: Date.now(),
            ttl: options.ttl,
          };
          const serialized = safeJsonStringify(item);
          this.storage.setItem(key, serialized);
          return true;
        } catch {
          console.error('[SafeStorage] Failed to save after cleanup');
          return false;
        }
      }

      console.error('[SafeStorage] Failed to set item:', error);
      return false;
    }
  }

  getItem<T>(key: string, fallback?: T): T | undefined {
    if (!this.storageAvailable) {
      return fallback;
    }

    try {
      const raw = this.storage.getItem(key);

      if (!raw) {
        return fallback;
      }

      const parseResult = safeJsonParse<StorageItem<T>>(raw);

      if (!parseResult.success || !parseResult.data) {
        console.warn(`[SafeStorage] Failed to parse ${key}:`, parseResult.error);
        this.storage.removeItem(key);
        return fallback;
      }

      const item = parseResult.data;

      if (item.version !== STORAGE_VERSION) {
        console.warn(`[SafeStorage] Version mismatch for ${key}, removing`);
        this.storage.removeItem(key);
        return fallback;
      }

      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        console.warn(`[SafeStorage] Item ${key} expired, removing`);
        this.storage.removeItem(key);
        return fallback;
      }

      return item.value;
    } catch (error) {
      console.error('[SafeStorage] Failed to get item:', error);
      return fallback;
    }
  }

  removeItem(key: string): void {
    if (!this.storageAvailable) {
      return;
    }

    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error('[SafeStorage] Failed to remove item:', error);
    }
  }

  clear(): void {
    if (!this.storageAvailable) {
      return;
    }

    try {
      this.storage.clear();
    } catch (error) {
      console.error('[SafeStorage] Failed to clear storage:', error);
    }
  }

  cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    if (!this.storageAvailable) {
      return 0;
    }

    let removed = 0;
    const now = Date.now();

    try {
      const keys = Object.keys(this.storage);

      for (const key of keys) {
        const raw = this.storage.getItem(key);
        if (!raw) continue;

        const parseResult = safeJsonParse<StorageItem<unknown>>(raw);

        if (!parseResult.success || !parseResult.data) {
          this.storage.removeItem(key);
          removed++;
          continue;
        }

        const item = parseResult.data;

        if (now - item.timestamp > maxAge) {
          this.storage.removeItem(key);
          removed++;
        }
      }

      log.info(`[SafeStorage] Cleaned up ${removed} items`);
    } catch (error) {
      console.error('[SafeStorage] Cleanup failed:', error);
    }

    return removed;
  }

  getUsage(): { used: number; available: boolean } {
    if (!this.storageAvailable) {
      return { used: 0, available: false };
    }

    try {
      let used = 0;
      const keys = Object.keys(this.storage);

      for (const key of keys) {
        const value = this.storage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }

      return { used, available: true };
    } catch {
      return { used: 0, available: false };
    }
  }
}

export const safeLocalStorage = new SafeStorage(localStorage);
export const safeSessionStorage = new SafeStorage(sessionStorage);
