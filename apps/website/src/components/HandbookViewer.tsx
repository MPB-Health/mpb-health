import React, { useMemo } from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/Card';

interface HandbookViewerProps {
  title: string;
  pdfPath: string;
  description?: string;
}

/**
 * Convert various PDF URL formats to embeddable iframe URLs
 * Supports: local files, Google Drive links, direct URLs
 */
function getEmbedUrl(pdfPath: string): string {
  // Google Drive share link: https://drive.google.com/file/d/{FILE_ID}/view
  const driveShareMatch = pdfPath.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveShareMatch) {
    const fileId = driveShareMatch[1];
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  // Google Drive direct link: https://drive.google.com/open?id={FILE_ID}
  const driveOpenMatch = pdfPath.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (driveOpenMatch) {
    const fileId = driveOpenMatch[1];
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  // Google Docs viewer link - already embeddable
  if (pdfPath.includes('docs.google.com')) {
    return pdfPath;
  }

  // Local or direct URL - use as-is
  return pdfPath;
}

/**
 * Get the direct download/view URL (for "Open in New Tab")
 */
function getViewUrl(pdfPath: string): string {
  // Google Drive: convert to direct view link
  const driveShareMatch = pdfPath.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveShareMatch) {
    const fileId = driveShareMatch[1];
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  const driveOpenMatch = pdfPath.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (driveOpenMatch) {
    const fileId = driveOpenMatch[1];
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  return pdfPath;
}

const HandbookViewer: React.FC<HandbookViewerProps> = ({ title, pdfPath, description }) => {
  const embedUrl = useMemo(() => getEmbedUrl(pdfPath), [pdfPath]);
  const viewUrl = useMemo(() => getViewUrl(pdfPath), [pdfPath]);
  const isGoogleDrive = pdfPath.includes('drive.google.com') || pdfPath.includes('docs.google.com');

  const handleDownload = () => {
    // For Google Drive, open the view link (download not directly available via programmatic click)
    if (isGoogleDrive) {
      window.open(viewUrl, '_blank');
      return;
    }
    
    const link = document.createElement('a');
    link.href = pdfPath;
    link.download = pdfPath.split('/').pop() || 'handbook.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    window.open(viewUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
              {description && (
                <p className="text-slate-600 mt-1">{description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button
              onClick={handleOpenNewTab}
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in New Tab
            </Button>
          </div>
        </div>

        <Card className="shadow-2xl">
          <CardContent className="p-0">
            <div className="relative w-full" style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
              <iframe
                src={embedUrl}
                className="w-full h-full rounded-lg"
                title={title}
                style={{ border: 'none' }}
                allow="autoplay"
                allowFullScreen
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            Having trouble viewing the handbook?{' '}
            <button
              onClick={handleDownload}
              className="text-blue-600 hover:text-blue-700 font-semibold underline"
            >
              Download it here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HandbookViewer;
