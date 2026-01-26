export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  loading?: 'lazy' | 'eager';
}

export const getOptimizedImageUrl = (
  src: string,
  options: ImageOptions = {}
): string => {
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
  } = options;

  if (src.startsWith('http') && !src.includes('mpb.health')) {
    return src;
  }

  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('f', format);

  return src.includes('?')
    ? `${src}&${params.toString()}`
    : `${src}?${params.toString()}`;
};

export const generateSrcSet = (
  src: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1536]
): string => {
  return widths
    .map(width => `${getOptimizedImageUrl(src, { width, format: 'webp' })} ${width}w`)
    .join(', ');
};

export const generateSizes = (
  breakpoints: Array<{ maxWidth: string; size: string }>
): string => {
  const sizeStrings = breakpoints.map(bp => `(max-width: ${bp.maxWidth}) ${bp.size}`);
  return sizeStrings.join(', ');
};

export const preloadImage = (src: string, options: ImageOptions = {}): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = getOptimizedImageUrl(src, options);
  link.type = `image/${options.format || 'webp'}`;
  document.head.appendChild(link);
};

export const lazyLoadImages = (): void => {
  if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach((img) => {
      const imgEl = img as HTMLImageElement;
      imgEl.src = imgEl.dataset.src!;
      imgEl.removeAttribute('data-src');
    });
  } else {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
  }
};

export const getImageDimensions = async (src: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
};

export const calculateAspectRatio = (width: number, height: number): string => {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  return `${width / divisor}/${height / divisor}`;
};
