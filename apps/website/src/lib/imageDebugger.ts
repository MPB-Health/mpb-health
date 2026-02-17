import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('ImageDebugger');

export interface ImageDebugResult {
  url: string;
  status: 'success' | 'error' | 'cors' | 'timeout';
  loadTime?: number;
  dimensions?: { width: number; height: number };
  error?: string;
  headers?: Record<string, string>;
}

export const debugImage = async (url: string, timeout = 10000): Promise<ImageDebugResult> => {
  const startTime = Date.now();
  const result: ImageDebugResult = {
    url,
    status: 'error',
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchResponse = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors',
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (fetchResponse && fetchResponse.ok) {
      const headers: Record<string, string> = {};
      fetchResponse.headers.forEach((value, key) => {
        headers[key] = value;
      });
      result.headers = headers;
    }

    const imgPromise = new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };

      img.onerror = (_e) => {
        reject(new Error('Image failed to load'));
      };

      img.src = url;

      setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, timeout);
    });

    const dimensions = await imgPromise;
    const loadTime = Date.now() - startTime;

    result.status = 'success';
    result.loadTime = loadTime;
    result.dimensions = dimensions;
  } catch (error) {
    result.loadTime = Date.now() - startTime;

    if (error instanceof Error) {
      if (error.message.includes('CORS')) {
        result.status = 'cors';
        result.error = 'CORS policy blocked this request';
      } else if (error.message.includes('timeout')) {
        result.status = 'timeout';
        result.error = 'Image load timeout exceeded';
      } else {
        result.status = 'error';
        result.error = error.message;
      }
    }
  }

  return result;
};

export const debugMultipleImages = async (urls: string[]): Promise<ImageDebugResult[]> => {
  const results = await Promise.all(urls.map(url => debugImage(url)));
  return results;
};

export const logImageDebug = (result: ImageDebugResult): void => {
  const icon = result.status === 'success' ? '✅' : '❌';
  const style = result.status === 'success' ? 'color: green' : 'color: red';

  console.group(`${icon} Image Debug: ${result.url}`);
  log.info(`%cStatus: ${result.status}`, style);

  if (result.loadTime) {
    log.info(`Load Time: ${result.loadTime}ms`);
  }

  if (result.dimensions) {
    log.info(`Dimensions: ${result.dimensions.width}x${result.dimensions.height}`);
  }

  if (result.headers) {
    log.info('Headers:', result.headers);
  }

  if (result.error) {
    console.error(`Error: ${result.error}`);
  }

  console.groupEnd();
};

export const checkImageAccessibility = async (url: string): Promise<{
  accessible: boolean;
  reason?: string;
  suggestions: string[];
}> => {
  const result = await debugImage(url);
  const suggestions: string[] = [];

  if (result.status === 'success') {
    return { accessible: true, suggestions: [] };
  }

  let reason = 'Unknown error';

  switch (result.status) {
    case 'cors':
      reason = 'CORS policy blocking the image';
      suggestions.push('Use the image proxy edge function');
      suggestions.push('Host the image on your own domain');
      suggestions.push('Request CORS headers from the image host');
      break;

    case 'timeout':
      reason = 'Image took too long to load';
      suggestions.push('Optimize and compress the image');
      suggestions.push('Use a CDN for faster delivery');
      suggestions.push('Check your network connection');
      break;

    case 'error':
      reason = result.error || 'Failed to load image';
      suggestions.push('Verify the URL is correct');
      suggestions.push('Check if the image exists at the URL');
      suggestions.push('Ensure HTTPS is used (not HTTP)');
      suggestions.push('Try opening the URL in a new tab');
      break;
  }

  return { accessible: false, reason, suggestions };
};

if (typeof window !== 'undefined') {
  (window as any).debugImage = debugImage;
  (window as any).debugMultipleImages = debugMultipleImages;
  (window as any).logImageDebug = logImageDebug;
  (window as any).checkImageAccessibility = checkImageAccessibility;

  log.info('🔍 Image Debugger loaded. Available functions:');
  log.info('  - debugImage(url)');
  log.info('  - debugMultipleImages([url1, url2])');
  log.info('  - logImageDebug(result)');
  log.info('  - checkImageAccessibility(url)');
}
