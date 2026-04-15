export interface QuoteTemplateSection {
  id: string;
  type: 'header' | 'line_items' | 'totals' | 'terms' | 'signature' | 'footer' | 'custom';
  visible: boolean;
  order: number;
  title?: string;
  content?: string;
}

export interface QuoteTemplateBranding {
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  headerBgColor: string;
  footerText: string | null;
}

export interface QuoteTemplateContentBlock {
  id: string;
  type: 'text' | 'divider' | 'spacer';
  content?: string;
  order: number;
}

export interface QuoteTemplate {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  layout: { sections: QuoteTemplateSection[] };
  branding: QuoteTemplateBranding;
  content_blocks: QuoteTemplateContentBlock[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteTemplateCreateInput {
  name: string;
  description?: string;
  is_default?: boolean;
  layout?: { sections: QuoteTemplateSection[] };
  branding?: Partial<QuoteTemplateBranding>;
  content_blocks?: QuoteTemplateContentBlock[];
}

export interface QuoteTemplateUpdateInput extends Partial<QuoteTemplateCreateInput> {
  is_active?: boolean;
}
