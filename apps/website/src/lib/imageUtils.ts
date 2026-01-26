export const normalizeImageUrl = (url: string): string => {
  if (!url) return '';

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  return `/${url.replace(/^\//, '')}`;
};

export const getImageProxyUrl = (originalUrl: string, useProxy: boolean = false): string => {
  if (!useProxy || !originalUrl.startsWith('http')) {
    return normalizeImageUrl(originalUrl);
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    console.warn('VITE_SUPABASE_URL not configured, returning original URL');
    return originalUrl;
  }

  const proxyUrl = `${supabaseUrl}/functions/v1/image-proxy`;
  return `${proxyUrl}?url=${encodeURIComponent(originalUrl)}`;
};

export const isExternalImage = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    await preloadImage(normalizeImageUrl(url));
    return true;
  } catch {
    return false;
  }
};

export const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = normalizeImageUrl(url);
  });
};
