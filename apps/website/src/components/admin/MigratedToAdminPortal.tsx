import { ExternalLink, AlertTriangle } from 'lucide-react';

interface Props {
  /** Path in the admin portal, e.g. "/content/blog" */
  adminPath: string;
  /** Human-readable name of the section, e.g. "Blog Posts" */
  sectionName: string;
}

/**
 * Non-breaking deprecation banner shown on website admin pages that have
 * been superseded by the canonical admin portal at admin.mpb.health.
 * The page keeps working — this just surfaces the better alternative.
 */
export default function MigratedToAdminPortal({ adminPath, sectionName }: Props) {
  const href = `https://admin.mpb.health${adminPath}`;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div className="flex-1 text-amber-800">
        <span className="font-medium">Heads up:</span> {sectionName} is now managed in the{' '}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:text-amber-900"
        >
          Admin Portal
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        . This page still works but will be removed in a future update.
      </div>
    </div>
  );
}
