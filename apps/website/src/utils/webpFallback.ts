/**
 * Returns the WebP variant path for a given image path if a WebP exists
 * at the same location. Falls back to original format.
 *
 * WebP files are generated at build time by scripts/optimize-images.mjs
 */
export function toWebP(src: string): string {
  if (!src || src.startsWith('http') || src.startsWith('data:')) return src;
  const match = src.match(/^(.*)\.(png|jpg|jpeg)(\?.*)?$/i);
  if (!match) return src;
  return `${match[1]}.webp${match[3] || ''}`;
}

/**
 * Generates props for a <picture> element with WebP + original format fallback.
 */
export function pictureProps(src: string) {
  const webp = toWebP(src);
  const isWebPSame = webp === src;
  return {
    webpSrc: isWebPSame ? undefined : webp,
    fallbackSrc: src,
  };
}
