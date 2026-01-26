import { useState, useEffect } from 'react';
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
import { contentService, type SOPDocument as SOPDocumentType } from '@mpbhealth/advisor-core';

export default function SOPDocument() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<SOPDocumentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocument = async () => {
      if (!documentId) return;

      try {
        const doc = await contentService.getSOPDocument(documentId);
        setDocument(doc);

        // Track view
        if (doc) {
          await contentService.trackSOPView(documentId);
        }
      } catch (err) {
        console.error('Failed to load document:', err);
        navigate('/sops');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [documentId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Document not found</p>
        <button
          onClick={() => navigate('/sops')}
          className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
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
        className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Library</span>
      </button>

      {/* Document header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                {document.title}
              </h1>
              <p className="text-neutral-500 mt-1">{document.category}</p>
            </div>
          </div>
          {document.file_url && (
            <a
              href={document.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Download</span>
            </a>
          )}
        </div>

        {document.description && (
          <p className="text-neutral-600 mt-4">{document.description}</p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-neutral-100 text-sm text-neutral-500">
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
            <Tag className="w-4 h-4 text-neutral-400" />
            {document.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-primary-50 text-primary-700 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Document content */}
      <div className="bg-white rounded-xl border border-neutral-200 p-8">
        {document.content_type === 'markdown' ? (
          <div className="prose prose-neutral max-w-none">
            <ReactMarkdown>{document.content}</ReactMarkdown>
          </div>
        ) : document.content_type === 'html' ? (
          <div
            className="prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: document.content }}
          />
        ) : document.content_type === 'pdf' && document.file_url ? (
          <iframe
            src={document.file_url}
            className="w-full h-[800px] border-0 rounded-lg"
            title={document.title}
          />
        ) : (
          <pre className="whitespace-pre-wrap text-neutral-700">
            {document.content}
          </pre>
        )}
      </div>
    </div>
  );
}
