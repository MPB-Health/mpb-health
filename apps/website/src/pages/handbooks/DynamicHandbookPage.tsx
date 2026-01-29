import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2, BookOpen, ArrowLeft } from 'lucide-react';
import HandbookViewer from '../../components/HandbookViewer';
import { handbooksService, type HandbookRecord } from '../../lib/handbooksService';
import { Button } from '../../components/ui/button';

const DynamicHandbookPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [handbook, setHandbook] = useState<HandbookRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHandbook = async () => {
      if (!slug) {
        setError('Handbook not found');
        setLoading(false);
        return;
      }

      try {
        const data = await handbooksService.getHandbookBySlug(slug);
        if (data) {
          // Check if handbook is active (public should only see active handbooks)
          if (!data.is_active) {
            setError('This handbook is currently unavailable');
          } else {
            setHandbook(data);
          }
        } else {
          setError('Handbook not found');
        }
      } catch (err) {
        console.error('Error loading handbook:', err);
        setError('Failed to load handbook');
      } finally {
        setLoading(false);
      }
    };

    loadHandbook();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading handbook...</p>
        </div>
      </div>
    );
  }

  if (error || !handbook) {
    return (
      <>
        <Helmet>
          <title>Handbook Not Found | MPB Health</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-10 w-10 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {error || 'Handbook Not Found'}
            </h1>
            <p className="text-slate-600 mb-6">
              The handbook you're looking for might have been moved or is no longer available.
            </p>
            <Button onClick={() => navigate('/')} className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return Home
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{handbook.name} | MPB Health</title>
        <meta name="description" content={handbook.description || `View the ${handbook.name}`} />
      </Helmet>
      <HandbookViewer
        title={handbook.name}
        pdfPath={handbook.pdf_path}
        description={handbook.description || undefined}
      />
    </>
  );
};

export default DynamicHandbookPage;
