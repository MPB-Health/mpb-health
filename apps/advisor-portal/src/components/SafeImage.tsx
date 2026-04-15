import { useState, useCallback, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackIcon?: React.ReactNode;
  fallbackClassName?: string;
  hideOnError?: boolean;
}

/**
 * Drop-in `<img>` replacement that gracefully handles load failures.
 *
 * Priority chain:
 *  1. Primary `src`
 *  2. `fallbackSrc` (optional secondary URL, e.g. local /images/… copy)
 *  3. `fallbackIcon` — React node rendered in place of the image
 *  4. Default: muted icon placeholder
 *
 * If `hideOnError` is true, the element is hidden entirely on failure.
 */
export default function SafeImage({
  fallbackSrc,
  fallbackIcon,
  fallbackClassName,
  hideOnError = false,
  className,
  alt,
  onError,
  ...props
}: SafeImageProps) {
  const [state, setState] = useState<'loading' | 'fallback' | 'error'>('loading');

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      onError?.(e);
      if (state === 'loading' && fallbackSrc) {
        setState('fallback');
        (e.target as HTMLImageElement).src = fallbackSrc;
      } else {
        setState('error');
      }
    },
    [state, fallbackSrc, onError],
  );

  if (state === 'error') {
    if (hideOnError) return null;
    if (fallbackIcon) {
      return <>{fallbackIcon}</>;
    }
    return (
      <div
        className={
          fallbackClassName ??
          `${className ?? ''} flex items-center justify-center bg-surface-tertiary text-th-text-tertiary`
        }
        role="img"
        aria-label={alt || 'Image unavailable'}
      >
        <ImageOff className="w-5 h-5 opacity-40" />
      </div>
    );
  }

  return (
    <img
      {...props}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}
