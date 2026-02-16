import React from 'react';
import { isValidReactComponent } from './componentGuard';

/**
 * Lazy loader utilities that properly handle both default and named exports,
 * preventing React Error #306 (lazy component not resolving correctly).
 * 
 * Also includes validation to prevent React Error #130 (invalid element type)
 * which occurs when createElement receives an invalid type (e.g., a number).
 */

/**
 * For modules that export a *default* React component:
 *   export default function MyComponent() { ... }
 * 
 * @example
 * import { lazyDefault } from '@/utils/lazyUtils';
 * const HeroCalculator = lazyDefault(() => import('./HeroCalculator'));
 */
export function lazyDefault<T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    importer().catch((error) => {
      console.error('[lazyDefault] Failed to load module:', error);
      throw error;
    })
  );
}

/**
 * For modules that export a *named* React component:
 *   export function MyComponent() { ... }
 *   export const MyComponent: React.FC = () => { ... }
 * 
 * This wrapper converts the named export to the { default: Component } shape
 * that React.lazy expects.
 * 
 * @example
 * import { lazyNamed } from '@/utils/lazyUtils';
 * const FaqSection = lazyNamed(() => import('./FaqSection'), 'FaqSection');
 */
export function lazyNamed<T extends React.ComponentType<any>>(
  importer: () => Promise<any>,
  exportName: string
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    importer()
      .then((mod) => {
        const component = mod[exportName];

        if (!component) {
          const availableExports = Object.keys(mod).join(', ');
          console.error(
            `[lazyNamed] Export "${exportName}" not found on module. Available exports: ${availableExports || 'none'}`,
            mod
          );
          throw new Error(
            `Lazy import failed: export "${exportName}" not found. Available: ${availableExports}`
          );
        }

        return { default: component as T };
      })
      .catch((error) => {
        console.error(`[lazyNamed] Failed to load module or export "${exportName}":`, error);
        throw error;
      })
  );
}

/**
 * A safer version of lazyDefault that includes retry logic for chunk load failures.
 * Useful for critical routes that should attempt recovery.
 * 
 * @example
 * const Dashboard = lazyWithRetry(() => import('./Dashboard'), 3);
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  retries: number = 2,
  retryDelay: number = 1000
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await importer();
      } catch (error) {
        lastError = error as Error;
        const isChunkError =
          lastError.message.includes('Loading chunk') ||
          lastError.message.includes('ChunkLoadError') ||
          lastError.message.includes('Failed to fetch dynamically imported module');

        if (isChunkError && attempt < retries) {
          console.warn(
            `[lazyWithRetry] Chunk load failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${retryDelay}ms...`,
            lastError.message
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          // Increase delay for subsequent retries
          retryDelay *= 1.5;
        } else {
          throw lastError;
        }
      }
    }

    throw lastError;
  });
}

type ModuleWithExports = Record<string, unknown> & {
  default?: React.ComponentType<any>;
  __esModule?: boolean;
};

interface LazyAutoOptions {
  displayName?: string;
  fallbackKey?: string;
}

function pickFallbackExport(
  module: ModuleWithExports,
  options: LazyAutoOptions
): React.ComponentType<any> | undefined {
  if (options.fallbackKey && typeof module[options.fallbackKey] === 'function') {
    return module[options.fallbackKey] as React.ComponentType<any>;
  }

  const candidateKey = Object.keys(module).find((key) => {
    if (key === 'default' || key === '__esModule') {
      return false;
    }
    const exported = module[key];
    return typeof exported === 'function' && /^[A-Z]/.test(key);
  });

  if (candidateKey) {
    return module[candidateKey] as React.ComponentType<any>;
  }

  return undefined;
}

/**
 * Validates that the given value is a valid React component type.
 * React error #130 occurs when createElement receives an invalid type (e.g., a number).
 * Uses the centralized isValidReactComponent from componentGuard.
 */
function isValidComponentType(value: unknown): value is React.ComponentType<any> {
  return isValidReactComponent(value);
}

// Track if we've already attempted a cache-clear reload to prevent infinite loops
const RELOAD_KEY = 'mpb_chunk_reload_attempted';
const RELOAD_TIMESTAMP_KEY = 'mpb_chunk_reload_timestamp';

function shouldAttemptReload(): boolean {
  try {
    const lastAttempt = sessionStorage.getItem(RELOAD_TIMESTAMP_KEY);
    if (lastAttempt) {
      const elapsed = Date.now() - parseInt(lastAttempt, 10);
      // Only allow one reload attempt per 30 seconds
      if (elapsed < 30000) {
        return false;
      }
    }
    return true;
  } catch {
    return true;
  }
}

function markReloadAttempted(): void {
  try {
    sessionStorage.setItem(RELOAD_KEY, 'true');
    sessionStorage.setItem(RELOAD_TIMESTAMP_KEY, Date.now().toString());
  } catch {
    // Ignore storage errors
  }
}

function clearCachesAndReload(): void {
  markReloadAttempted();
  
  // Clear all caches
  if ('caches' in window && window.caches) {
    window.caches.keys().then((names) => {
      Promise.all(names.map((name) => window.caches!.delete(name))).then(() => {
        // Force reload bypassing cache
        window.location.reload();
      });
    }).catch(() => {
      window.location.reload();
    });
  } else {
    window.location.reload();
  }
}

/**
 * Automatically finds a usable React component export (default or named) for lazy loading.
 * This prevents React error #306 even if a module forgets to provide a default export.
 * Also includes validation to prevent React error #130 (invalid element type).
 * 
 * Auto-recovery: On chunk load failures (stale cache), automatically clears cache and reloads.
 */
export function lazyAuto<TModule extends ModuleWithExports>(
  importer: () => Promise<TModule>,
  options: LazyAutoOptions = {}
): React.LazyExoticComponent<any> {
  return React.lazy(async () => {
    let loadedModule: ModuleWithExports;
    let lastError: Error | null = null;
    
    // Try up to 2 times before triggering reload
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        loadedModule = (await importer()) as ModuleWithExports;
        break;
      } catch (importError) {
        lastError = importError instanceof Error ? importError : new Error(String(importError));
        const errorMessage = lastError.message;
        const isChunkError = 
          errorMessage.includes('Loading chunk') ||
          errorMessage.includes('ChunkLoadError') ||
          errorMessage.includes('Failed to fetch dynamically imported module') ||
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('error loading dynamically imported module');
        
        if (isChunkError) {
          console.warn(
            `[lazyAuto] Chunk load failed (attempt ${attempt + 1}/2). Likely stale cache.`,
            '\nError:', errorMessage
          );
          
          if (attempt === 0) {
            // Wait briefly before retry
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue;
          }
          
          // After retries failed, attempt auto-recovery via reload
          if (shouldAttemptReload()) {
            console.warn('[lazyAuto] Auto-recovering: clearing cache and reloading page...');
            clearCachesAndReload();
            // Return a promise that never resolves (page will reload)
            return new Promise(() => {});
          }
        }
        
        throw lastError;
      }
    }
    
    if (!loadedModule!) {
      throw lastError || new Error('[lazyAuto] Module failed to load');
    }

    // Validate the module loaded correctly
    if (!loadedModule || typeof loadedModule !== 'object') {
      const moduleName = options.displayName ?? 'unknown module';
      console.error(
        `[lazyAuto] Module "${moduleName}" did not load correctly. Received:`,
        typeof loadedModule,
        loadedModule
      );
      throw new Error(
        `[lazyAuto] Module "${moduleName}" failed to load correctly. Got ${typeof loadedModule} instead of object.`
      );
    }

    if (loadedModule.default !== undefined) {
      // Validate that default export is a valid component type
      if (isValidComponentType(loadedModule.default)) {
        return { default: loadedModule.default };
      }
      
      // Log a detailed error if default export is not a valid component
      // This is the key check that catches React error #130 causes
      const moduleName = options.displayName ?? 'unknown module';
      const defaultType = typeof loadedModule.default;
      const defaultValue = loadedModule.default;
      
      console.error(
        `[lazyAuto] CRITICAL: Module "${moduleName}" has a default export that is NOT a valid React component.`,
        `\nType: ${defaultType}`,
        `\nValue:`, defaultValue,
        `\nThis will cause React Error #130 (Element type is invalid: expected string or function but got ${defaultType}).`,
        `\nThis is often caused by stale cached chunks after deployment. Clear browser cache and reload.`,
        `\nURL: ${window.location.href}`
      );
      
      // Don't immediately throw - try fallback first
    }

    const fallbackComponent = pickFallbackExport(loadedModule, options);

    if (fallbackComponent) {
      // Double-check the fallback is valid
      if (!isValidComponentType(fallbackComponent)) {
        const moduleName = options.displayName ?? 'unknown module';
        console.error(
          `[lazyAuto] Fallback export for "${moduleName}" is not a valid React component.`,
          `Type: ${typeof fallbackComponent}`,
          `\nThis will cause React Error #130.`
        );
        throw new Error(
          `[lazyAuto] Fallback export is not a valid component. Got ${typeof fallbackComponent}. This is likely due to a stale cache - please reload the page.`
        );
      }

      if (import.meta.env.DEV) {
        const moduleName =
          options.displayName ??
          importer.toString().match(/['"](.*)['"]/)?.[1] ??
          'unknown module';
        console.warn(
          `[lazyAuto] Using named export for ${moduleName}. Consider adding a default export.`
        );
      }
      return { default: fallbackComponent };
    }

    const availableExports = Object.keys(loadedModule).join(', ') || 'none';
    const defaultType = typeof loadedModule.default;
    
    throw new Error(
      `[lazyAuto] Module did not provide a valid React component. ` +
      `Default export type: ${defaultType}. ` +
      `Available exports: ${availableExports}. ` +
      `This may be caused by stale cached chunks - please clear browser cache and reload.`
    );
  });
}

