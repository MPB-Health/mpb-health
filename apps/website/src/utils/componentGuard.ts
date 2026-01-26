/**
 * Component Guard Utility
 * 
 * Provides runtime validation to prevent React Error #130 (Invalid Element Type).
 * This error occurs when React receives an invalid value for a component type
 * (e.g., number, string, boolean, undefined, null, or plain object).
 * 
 * Common causes:
 * - Tier/plan configuration with numeric component references instead of actual components
 * - Lazy loading returning non-component values
 * - Stale cached chunks after deployment
 * - Missing or incorrect exports
 */

import React from 'react';

export interface ComponentGuardResult<T extends React.ComponentType<any>> {
  component: T;
  isValid: boolean;
  originalValue: unknown;
  debugInfo: string;
}

/**
 * Validates that a value is a valid React component type.
 * 
 * Valid types include:
 * - Functions (function components, class components)
 * - Objects with $$typeof (React.memo, React.forwardRef, React.lazy)
 * - Strings (built-in DOM elements like 'div', 'span')
 */
export function isValidReactComponent(value: unknown): boolean {
  // Null/undefined are never valid
  if (value === null || value === undefined) {
    return false;
  }

  // Functions are valid (class or function components)
  if (typeof value === 'function') {
    return true;
  }

  // Strings are valid (DOM elements like 'div', 'span')
  if (typeof value === 'string') {
    return true;
  }

  // Objects with $$typeof are valid (memo, forwardRef, lazy, etc.)
  if (typeof value === 'object' && '$$typeof' in value) {
    return true;
  }

  return false;
}

/**
 * Validates that a value is a valid React component and throws if it's not.
 * Use this to guard component rendering and catch issues early.
 * 
 * @param value - The value to validate
 * @param label - A descriptive label for error messages (e.g., "selectedTier.component")
 * @returns The validated component if valid
 * @throws Error if the value is not a valid React component
 * 
 * @example
 * ```tsx
 * import { ensureReactComponent } from '@/utils/componentGuard';
 * 
 * // In a component that renders based on tier selection:
 * const Component = ensureReactComponent(selectedTier.component, "selectedTier.component");
 * return <Component />;
 * ```
 */
export function ensureReactComponent<T extends React.ComponentType<any> = React.ComponentType<any>>(
  value: unknown,
  label: string = 'component'
): T {
  // Check for primitive types that are definitely invalid
  if (typeof value === 'number') {
    console.error(
      `[ComponentGuard] ${label} is invalid: Received a NUMBER (${value}) instead of a component.`,
      '\nThis is a critical error that will cause React Error #130.',
      '\nCommon cause: Tier configuration has numeric IDs instead of actual component references.',
      '\nFix: Replace numeric values with actual component imports.'
    );
    throw new Error(
      `[ComponentGuard] ${label} is invalid: Received a primitive (number: ${value}) instead of a component. ` +
      `This is often caused by tier configuration using numeric IDs instead of component references.`
    );
  }

  if (typeof value === 'boolean') {
    console.error(
      `[ComponentGuard] ${label} is invalid: Received a BOOLEAN (${value}) instead of a component.`,
      '\nThis will cause React Error #130.'
    );
    throw new Error(
      `[ComponentGuard] ${label} is invalid: Received a primitive (boolean: ${value}) instead of a component.`
    );
  }

  if (typeof value === 'string' && !isHTMLElement(value)) {
    console.error(
      `[ComponentGuard] ${label} is invalid: Received a STRING ("${value}") that is not a valid HTML element.`,
      '\nValid strings are only built-in HTML tags like "div", "span", etc.',
      '\nThis will cause React Error #130.'
    );
    throw new Error(
      `[ComponentGuard] ${label} is invalid: Received a string ("${value}") that is not a valid HTML element.`
    );
  }

  if (value === null) {
    console.error(
      `[ComponentGuard] ${label} is invalid: Received NULL instead of a component.`,
      '\nThis will cause React Error #130.',
      '\nCommon cause: Component import failed or returned null.'
    );
    throw new Error(
      `[ComponentGuard] ${label} is invalid: Received null instead of a component.`
    );
  }

  if (value === undefined) {
    console.error(
      `[ComponentGuard] ${label} is invalid: Received UNDEFINED instead of a component.`,
      '\nThis will cause React Error #130.',
      '\nCommon causes:',
      '\n  - Missing export from the component module',
      '\n  - Typo in import/export name',
      '\n  - Circular dependency',
      '\n  - Stale cached chunks after deployment'
    );
    throw new Error(
      `[ComponentGuard] ${label} is invalid: Received undefined instead of a component. ` +
      `Check for missing exports, typos, or stale cache.`
    );
  }

  // Check for plain objects (not React elements)
  if (typeof value === 'object' && !('$$typeof' in value)) {
    const keys = Object.keys(value as object).slice(0, 5).join(', ');
    console.error(
      `[ComponentGuard] ${label} is invalid: Received a plain OBJECT instead of a component.`,
      `\nObject keys: ${keys}`,
      '\nThis will cause React Error #130.',
      '\nCommon cause: Passing a config object instead of a component reference.'
    );
    throw new Error(
      `[ComponentGuard] ${label} is invalid: Received a plain object instead of a component. ` +
      `Object keys: ${keys}`
    );
  }

  // Final validation
  if (!isValidReactComponent(value)) {
    console.error(
      `[ComponentGuard] ${label} is not a valid React component.`,
      `\nReceived type: ${typeof value}`,
      `\nValue:`, value,
      '\nThis will cause React Error #130.'
    );
    throw new Error(
      `[ComponentGuard] ${label} is not a valid React component. Received: ${typeof value}`
    );
  }

  return value as T;
}

/**
 * Non-throwing version of component validation.
 * Returns the component if valid, or null if invalid.
 * Logs a warning but doesn't throw.
 */
export function validateComponent<T extends React.ComponentType<any>>(
  value: unknown,
  label: string = 'component'
): T | null {
  try {
    return ensureReactComponent<T>(value, label);
  } catch {
    return null;
  }
}

/**
 * Wraps a component getter with validation.
 * Useful for tier/plan selections where the component might be invalid.
 * 
 * @example
 * ```tsx
 * const { Component, isValid, debugInfo } = guardComponent(
 *   () => selectedTier?.component,
 *   FallbackComponent,
 *   "selectedTier.component"
 * );
 * ```
 */
export function guardComponent<T extends React.ComponentType<any>>(
  getter: () => unknown,
  fallback: T,
  label: string = 'component'
): ComponentGuardResult<T> {
  try {
    const value = getter();
    const component = ensureReactComponent<T>(value, label);
    return {
      component,
      isValid: true,
      originalValue: value,
      debugInfo: `${label}: Valid component`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(
      `[ComponentGuard] Using fallback for ${label}:`,
      errorMessage
    );
    return {
      component: fallback,
      isValid: false,
      originalValue: getter(),
      debugInfo: `${label}: Invalid, using fallback. Error: ${errorMessage}`,
    };
  }
}

/**
 * Check if a string is a valid HTML element name.
 * Only allows standard HTML elements to prevent arbitrary string rendering.
 */
function isHTMLElement(tag: string): boolean {
  const htmlElements = new Set([
    'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
    'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button',
    'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
    'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt',
    'em', 'embed',
    'fieldset', 'figcaption', 'figure', 'footer', 'form',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html',
    'i', 'iframe', 'img', 'input', 'ins',
    'kbd', 'label', 'legend', 'li', 'link',
    'main', 'map', 'mark', 'menu', 'meta', 'meter',
    'nav', 'noscript',
    'object', 'ol', 'optgroup', 'option', 'output',
    'p', 'param', 'picture', 'pre', 'progress',
    'q',
    'rp', 'rt', 'ruby',
    's', 'samp', 'script', 'section', 'select', 'slot', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'svg',
    'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track',
    'u', 'ul',
    'var', 'video',
    'wbr',
  ]);
  
  return htmlElements.has(tag.toLowerCase());
}

/**
 * Debug utility to log component validation status.
 * Use in development to trace component resolution issues.
 */
export function debugComponentType(value: unknown, label: string): void {
  if (process.env.NODE_ENV !== 'development' && !import.meta.env.DEV) {
    return;
  }

  const typeInfo = {
    label,
    type: typeof value,
    isNull: value === null,
    isUndefined: value === undefined,
    isFunction: typeof value === 'function',
    isObject: typeof value === 'object',
    hasTypeOf: typeof value === 'object' && value !== null && '$$typeof' in value,
    isValidComponent: isValidReactComponent(value),
    constructorName: value && typeof value === 'object' ? (value as any).constructor?.name : undefined,
    value: value,
  };

  console.group(`[ComponentGuard Debug] ${label}`);
  console.table(typeInfo);
  console.groupEnd();
}

export default {
  ensureReactComponent,
  validateComponent,
  guardComponent,
  isValidReactComponent,
  debugComponentType,
};














