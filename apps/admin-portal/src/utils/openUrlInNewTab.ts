/**
 * Open a URL in a new tab without losing the browser's user-gesture context.
 * Call synchronously from a click handler before any await.
 */
export function openUrlInNewTab(url: string, popup?: Window | null): boolean {
  const target = popup ?? window.open('about:blank', '_blank');
  if (!target) return false;
  target.location.href = url;
  return true;
}
