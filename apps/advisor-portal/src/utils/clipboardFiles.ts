/**
 * Extract File objects from a paste/drop DataTransfer.
 * Prefer `items` (macOS screenshots often appear there) and fall back to `files`.
 * Also recover images embedded as data: URLs in text/html (common when copying
 * snippets from browsers, docs, and many screenshot tools).
 */

const DATA_IMAGE_RE = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i;

/** Convert a data:image/...;base64,... URL into a File, or null if invalid. */
export function fileFromDataImageUrl(dataUrl: string, index = 0): File | null {
  const match = DATA_IMAGE_RE.exec(dataUrl.trim());
  if (!match) return null;

  const mime = match[1].toLowerCase();
  const b64 = match[2].replace(/\s+/g, '');
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const subtype = mime.split('/')[1]?.split('+')[0] || 'png';
    const ext = subtype === 'jpeg' ? 'jpg' : subtype;
    const suffix = index > 0 ? `-${index + 1}` : '';
    return new File([bytes], `pasted-${Date.now()}${suffix}.${ext}`, {
      type: mime,
      lastModified: Date.now(),
    });
  } catch {
    return null;
  }
}

/** Pull image Files out of clipboard HTML (`<img src="data:image/...">`). */
export function filesFromHtmlClipboard(html: string | null | undefined): File[] {
  if (!html?.includes('data:image')) return [];

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const imgs = Array.from(doc.querySelectorAll('img[src]'));
  const files: File[] = [];

  imgs.forEach((img, index) => {
    const src = img.getAttribute('src') || '';
    if (!src.startsWith('data:image')) return;
    const file = fileFromDataImageUrl(src, files.length + index);
    if (file) files.push(file);
  });

  return files;
}

export function filesFromDataTransfer(data: DataTransfer | null | undefined): File[] {
  if (!data) return [];

  const fromItems: File[] = [];
  if (data.items?.length) {
    for (const item of Array.from(data.items)) {
      if (item.kind !== 'file') continue;
      const file = item.getAsFile();
      if (file) fromItems.push(file);
    }
  }
  if (fromItems.length) return fromItems;

  return data.files?.length ? Array.from(data.files) : [];
}

/** Give clipboard blobs a stable download-friendly name (e.g. screenshot pastes). */
export function withPastedFileName(file: File, index = 0): File {
  if (file.name && file.name !== 'blob') return file;
  const subtype = file.type.split('/')[1]?.split('+')[0] || 'png';
  const ext = subtype === 'jpeg' ? 'jpg' : subtype;
  const suffix = index > 0 ? `-${index + 1}` : '';
  return new File([file], `pasted-${Date.now()}${suffix}.${ext}`, {
    type: file.type || 'application/octet-stream',
    lastModified: file.lastModified || Date.now(),
  });
}

/**
 * Clipboard / drop files ready to queue as ticket attachments.
 * Merges OS file items with images embedded in text/html data URLs.
 * When real image file items already exist, HTML-derived duplicates are skipped.
 */
export function filesFromClipboardEvent(data: DataTransfer | null | undefined): File[] {
  const fromTransfer = filesFromDataTransfer(data).map((file, index) =>
    withPastedFileName(file, index),
  );
  let html = '';
  try {
    html = data?.getData('text/html') || '';
  } catch {
    html = '';
  }
  const fromHtml = filesFromHtmlClipboard(html);

  if (!fromHtml.length) return fromTransfer;
  if (!fromTransfer.length) {
    return fromHtml.map((file, index) => withPastedFileName(file, index));
  }

  const hasImageFile = fromTransfer.some((f) => f.type.startsWith('image/'));
  if (hasImageFile) return fromTransfer;

  return [
    ...fromTransfer,
    ...fromHtml.map((file, index) => withPastedFileName(file, fromTransfer.length + index)),
  ];
}

/**
 * Remove composer-only preview media (blob:/data: images) before persisting
 * ticket HTML. Real bytes live in ticket_files / storage after upload.
 */
export function stripEphemeralInlineMedia(html: string): string {
  if (!html) return html;
  return html
    .replace(/<img\b[^>]*\bsrc=["'](?:blob:|data:)[^"']*["'][^>]*>/gi, '')
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
    .trim();
}
