const ALLOWED_TAGS = ['p', 'ul', 'li', 'strong', 'a'];
const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href', 'target', 'rel']
};

export function sanitizeHTML(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  function cleanNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return node;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      if (!ALLOWED_TAGS.includes(tagName)) {
        return null;
      }

      const newElement = document.createElement(tagName);

      const allowedAttrs = ALLOWED_ATTRS[tagName] || [];
      for (const attr of allowedAttrs) {
        const value = element.getAttribute(attr);
        if (value) {
          if (attr === 'href') {
            if (value.startsWith('http://') || value.startsWith('https://')) {
              newElement.setAttribute(attr, value);
            }
          } else {
            newElement.setAttribute(attr, value);
          }
        }
      }

      if (tagName === 'a' && !newElement.hasAttribute('rel')) {
        newElement.setAttribute('rel', 'noopener noreferrer');
      }

      for (const child of Array.from(element.childNodes)) {
        const cleanedChild = cleanNode(child);
        if (cleanedChild) {
          newElement.appendChild(cleanedChild);
        }
      }

      return newElement;
    }

    return null;
  }

  const cleanedBody = document.createElement('div');
  for (const child of Array.from(doc.body.childNodes)) {
    const cleanedChild = cleanNode(child);
    if (cleanedChild) {
      cleanedBody.appendChild(cleanedChild);
    }
  }

  return cleanedBody.innerHTML;
}
