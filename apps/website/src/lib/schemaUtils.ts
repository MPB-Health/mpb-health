import { safeJsonStringify } from './safeJson';

export function sanitizeForJsonLd(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

export function generateSafeSchema(schemaObject: unknown): string {
  try {
    const jsonString = safeJsonStringify(schemaObject);

    if (!jsonString || jsonString === '{}') {
      return '';
    }

    return jsonString;
  } catch (error) {
    console.warn('[SchemaUtils] Failed to generate schema:', error);
    return '';
  }
}

export interface BreadcrumbItem {
  name: string;
  item: string;
  position: number;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): string {
  try {
    if (!Array.isArray(items) || items.length === 0) {
      return '';
    }

    const validItems = items.filter(
      (item) =>
        item &&
        typeof item.name === 'string' &&
        typeof item.item === 'string' &&
        typeof item.position === 'number'
    );

    if (validItems.length === 0) {
      return '';
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: validItems.map((item) => ({
        '@type': 'ListItem',
        position: item.position,
        name: sanitizeForJsonLd(item.name),
        item: sanitizeForJsonLd(item.item),
      })),
    };

    return generateSafeSchema(schema);
  } catch (error) {
    console.warn('[SchemaUtils] Failed to generate breadcrumb schema:', error);
    return '';
  }
}

export interface FAQItem {
  question: string;
  answer: string;
}

export function generateFAQSchema(faqs: FAQItem[]): string {
  try {
    if (!Array.isArray(faqs) || faqs.length === 0) {
      return '';
    }

    const validFaqs = faqs.filter(
      (faq) =>
        faq &&
        typeof faq.question === 'string' &&
        typeof faq.answer === 'string' &&
        faq.question.trim() !== '' &&
        faq.answer.trim() !== ''
    );

    if (validFaqs.length === 0) {
      return '';
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: validFaqs.map((faq) => ({
        '@type': 'Question',
        name: sanitizeForJsonLd(faq.question),
        acceptedAnswer: {
          '@type': 'Answer',
          text: sanitizeForJsonLd(faq.answer),
        },
      })),
    };

    return generateSafeSchema(schema);
  } catch (error) {
    console.warn('[SchemaUtils] Failed to generate FAQ schema:', error);
    return '';
  }
}
