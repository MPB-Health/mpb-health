import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Calendar,
  Eye,
  Download,
  Share2,
  FileText,
  Video,
  CheckSquare,
  Megaphone,
  FileCheck,
  File,
  ExternalLink,
} from 'lucide-react';
import { useResourceDetail, incrementDownloadCount } from '../hooks/useResources';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/Badge';
import { ResourceCard } from '../components/resources/ResourceCard';
import { useResources } from '../hooks/useResources';
import { sanitizeHtml } from '@mpbhealth/utils';

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'Guide':
      return FileText;
    case 'Webinar':
      return Video;
    case 'Checklist':
      return CheckSquare;
    case 'Marketing':
      return Megaphone;
    case 'Form':
      return FileCheck;
    default:
      return File;
  }
};

const getAudienceBadgeVariant = (
  audience: string
): 'default' | 'primary' | 'success' | 'accent' => {
  switch (audience) {
    case 'Members':
      return 'primary';
    case 'Employers':
      return 'success';
    case 'Advisors':
      return 'accent';
    default:
      return 'default';
  }
};

export const ResourceDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { resource, loading, error } = useResourceDetail(slug || '');
  const [showShareMenu, setShowShareMenu] = useState(false);

  const { resources: relatedResources } = useResources({
    search: '',
    types: resource ? [resource.resource_type] : [],
    audiences: [],
    topics: [],
    sortBy: 'newest',
  });

  const related = relatedResources
    .filter((r) => r.id !== resource?.id)
    .slice(0, 3);

  const handleDownload = async () => {
    if (resource?.file_url && resource?.id) {
      await incrementDownloadCount(resource.id);
      window.open(resource.file_url, '_blank');
    }
  };

  const handleShare = (platform: 'twitter' | 'linkedin' | 'email') => {
    const url = window.location.href;
    const title = resource?.title || '';

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
    };

    window.open(shareUrls[platform], '_blank');
    setShowShareMenu(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-neutral-600">Loading resource...</div>
      </div>
    );
  }

  if (error || !resource) {
    return <Navigate to="/resources" replace />;
  }

  const Icon = getResourceIcon(resource.resource_type);

  return (
    <>
      <Helmet>
        <title>{resource.title} | Resource Library | MPB Health</title>
        <meta name="description" content={resource.description} />
        <meta property="og:title" content={resource.title} />
        <meta property="og:description" content={resource.description} />
        <meta property="og:image" content={resource.featured_image_url} />
      </Helmet>

      <article className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Resource Library
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {resource.featured_image_url && (
                <div className="relative h-96 rounded-xl overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200">
                  <img
                    src={
                      resource.featured_image_url.startsWith('http')
                        ? resource.featured_image_url
                        : `/${resource.featured_image_url.replace(/^\//, '')}`
                    }
                    alt={resource.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    <Icon className="h-4 w-4" />
                    {resource.resource_type}
                  </div>
                  <Badge variant={getAudienceBadgeVariant(resource.target_audience)}>
                    {resource.target_audience}
                  </Badge>
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4 leading-tight">
                  {resource.title}
                </h1>

                <p className="text-xl text-neutral-600 mb-6 leading-relaxed">
                  {resource.description}
                </p>

                <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-500 pb-6 border-b border-neutral-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(resource.published_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{resource.view_count} views</span>
                  </div>
                  {resource.file_url && (
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span>{resource.download_count} downloads</span>
                    </div>
                  )}
                </div>
              </div>

              <div
                className="prose prose-neutral max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(resource.content) }}
              />
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="sticky top-8 space-y-6">
                {resource.file_url && (
                  <div className="bg-gradient-to-br from-primary/10 to-cyan-500/10 rounded-xl p-6 border border-primary/20">
                    <h3 className="font-bold text-neutral-900 mb-2">Download Resource</h3>
                    <p className="text-sm text-neutral-600 mb-4">
                      Access the full resource document
                    </p>
                    <Button onClick={handleDownload} className="w-full group bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 inline-flex items-center justify-center">
                      <Download className="mr-2 h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
                      Download Now
                    </Button>
                  </div>
                )}

                <div className="bg-white rounded-xl p-6 border border-neutral-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-neutral-900">Share Resource</h3>
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <Share2 className="h-4 w-4 text-neutral-600" />
                    </button>
                  </div>
                  {showShareMenu && (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleShare('linkedin')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 rounded-lg transition-colors"
                      >
                        Share on LinkedIn
                      </button>
                      <button
                        onClick={() => handleShare('twitter')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 rounded-lg transition-colors"
                      >
                        Share on Twitter
                      </button>
                      <button
                        onClick={() => handleShare('email')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 rounded-lg transition-colors"
                      >
                        Share via Email
                      </button>
                    </div>
                  )}
                </div>

                {resource.topics.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-neutral-200">
                    <h3 className="font-bold text-neutral-900 mb-3">Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {resource.topics.map((topic) => (
                        <span
                          key={topic}
                          className="inline-block px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl p-6 border border-neutral-200">
                  <h3 className="font-bold text-neutral-900 mb-2">Need Help?</h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    Have questions about this resource? Our team is here to help.
                  </p>
                  <Link to="/contact">
                    <Button variant="outline" className="w-full group border-2 border-blue-600 text-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-green-600 hover:text-white transition-all duration-300 inline-flex items-center justify-center">
                      Contact Us
                      <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="bg-neutral-50 py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-neutral-900 mb-8">Related Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {related.map((relatedResource) => (
                  <ResourceCard key={relatedResource.id} resource={relatedResource} />
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </>
  );
};

export default ResourceDetail;
