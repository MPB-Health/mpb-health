const SAMPLE_DATA: Record<string, string> = {
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane.doe@example.com',
  phone: '(555) 123-4567',
  company: 'Acme Corp',
};

function renderPreview(text: string): string {
  let rendered = text;
  for (const [key, value] of Object.entries(SAMPLE_DATA)) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return rendered;
}

interface TemplatePreviewProps {
  body: string;
  subject?: string;
}

export function TemplatePreview({ body, subject }: TemplatePreviewProps) {
  return (
    <div className="border border-th-border rounded-lg overflow-hidden">
      <div className="bg-surface-secondary px-4 py-2 border-b border-th-border">
        <span className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
          Preview
        </span>
      </div>
      <div className="p-4 space-y-2">
        {subject && (
          <div>
            <span className="text-xs text-th-text-tertiary">Subject: </span>
            <span className="text-sm font-medium text-th-text-secondary">
              {renderPreview(subject)}
            </span>
          </div>
        )}
        <div className="text-sm text-th-text-secondary whitespace-pre-wrap">
          {renderPreview(body)}
        </div>
      </div>
    </div>
  );
}
