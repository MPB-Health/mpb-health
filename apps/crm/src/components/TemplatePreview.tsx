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
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Preview
        </span>
      </div>
      <div className="p-4 space-y-2">
        {subject && (
          <div>
            <span className="text-xs text-neutral-400">Subject: </span>
            <span className="text-sm font-medium text-neutral-700">
              {renderPreview(subject)}
            </span>
          </div>
        )}
        <div className="text-sm text-neutral-600 whitespace-pre-wrap">
          {renderPreview(body)}
        </div>
      </div>
    </div>
  );
}
