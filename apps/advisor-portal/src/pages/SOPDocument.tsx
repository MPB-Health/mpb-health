import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Eye,
  Tag,
  Download,
  ExternalLink,
} from 'lucide-react';
import { contentService } from '@mpbhealth/advisor-core';
import { sanitizeHtml } from '@mpbhealth/utils';
import { useAdvisorPageDebugLog } from '../hooks/useAdvisorPageDebugLog';
import { useAdvisorQueryReady } from '../hooks/useAdvisorQueryReady';
import { AdvisorPageLoader } from '../components/loading';

export default function SOPDocument() {
  useAdvisorPageDebugLog('SOPDocument');
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { advisorReady } = useAdvisorQueryReady();
  const { data: document = null, isPending: loading, isError } = useQuery({
    queryKey: ['sopDocument', documentId],
    queryFn: async () => {
      const doc = await contentService.getSOPDocument(documentId!);
      if (doc) await contentService.trackSOPView(documentId!);
      return doc;
    },
    enabled: advisorReady && Boolean(documentId),
    staleTime: 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (!isError) return;
    console.error('Failed to load document');
    navigate('/sops');
  }, [isError, navigate]);

  if (loading) {
    return (
      <AdvisorPageLoader
        message="Loading document…"
        subtitle="Opening this resource from the library."
      />
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-th-text-tertiary">Document not found</p>
        <button
          onClick={() => navigate('/sops')}
          className="mt-4 text-th-accent-600 hover:text-th-accent-700 font-medium"
        >
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/sops')}
        className="flex items-center space-x-2 text-th-text-secondary hover:text-th-text-primary"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Library</span>
      </button>

      {/* Document header */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 bg-th-accent-100 rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-th-accent-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-th-text-primary">
                {document.title}
              </h1>
              <p className="text-th-text-tertiary mt-1">{document.category}</p>
            </div>
          </div>
          {document.file_url && (
            <a
              href={document.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-50 text-th-accent-700 rounded-lg hover:bg-th-accent-100 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Download</span>
            </a>
          )}
        </div>

        {document.description && (
          <p className="text-th-text-secondary mt-4">{document.description}</p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-th-border-subtle text-sm text-th-text-tertiary">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Updated {new Date(document.updated_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{document.view_count} views</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Version {document.version}</span>
          </div>
        </div>

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 mt-4">
            <Tag className="w-4 h-4 text-th-text-tertiary" />
            {document.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-th-accent-50 text-th-accent-700 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Document content */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-8">
        {document.content_type === 'markdown' ? (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown>{document.content}</ReactMarkdown>
          </div>
        ) : document.content_type === 'html' ? (
          <div
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(document.content) }}
          />
        ) : document.content_type === 'pdf' && document.file_url ? (
          <iframe
            src={document.file_url}
            className="w-full h-[800px] border-0 rounded-lg"
            title={document.title}
          />
        ) : (
          <pre className="whitespace-pre-wrap text-th-text-secondary">
            {document.content}
          </pre>
        )}
      </div>
    </div>
  );
}
