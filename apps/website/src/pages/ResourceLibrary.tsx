import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { useResources } from '../hooks/useResources';
import { ResourceFilters as IResourceFilters } from '../lib/supabase';
import { ResourceFilters } from '../components/resources/ResourceFilters';
import { ResourceCard } from '../components/resources/ResourceCard';
import { Button } from '../components/ui/button';

export const ResourceLibrary: React.FC = () => {
  const [filters, setFilters] = useState<IResourceFilters>({
    search: '',
    types: [],
    audiences: [],
    topics: [],
    sortBy: 'newest',
  });

  const { resources, topics, loading, error, totalCount } = useResources(filters);

  const featuredResources = resources.filter((r) => r.is_featured).slice(0, 3);
  const regularResources = resources.filter((r) => !r.is_featured);

  return (
    <>
      <Helmet>
        <title>Resource Library | MPB Health</title>
        <meta
          name="description"
          content="Access guides, webinars, compliance documents, and educational resources to support your health sharing journey with MPB Health."
        />
      </Helmet>

      <section className="relative pt-20 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50/50" />
        <div className="absolute inset-0 opacity-30">
          <img
            src="/assets/healthcare-images-for-healthcare-blog-website2-980x653.png"
            alt="Resource Library"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/80" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
              <BookOpen className="w-3 h-3 mr-1" />
              Resource Library
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900 text-balance">
              Your Complete Resource Hub
            </h1>

            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Access guides, forms, and educational materials to support your health sharing journey.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const element = document.getElementById('features-grid');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg"
              >
                Browse Resources
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setFilters({ ...filters, types: ['Form'] });
                  setTimeout(() => {
                    const element = document.getElementById('features-grid');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300"
              >
                <FileText className="w-4 h-4" />
                View Forms
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-gradient-to-b from-white to-gray-50">
        {featuredResources.length > 0 && (
          <section className="py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <Badge className="mb-4 bg-yellow-100 text-yellow-700 border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Featured Resources
                </Badge>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  Most Popular Resources
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Our most popular and recently updated guides and materials
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="features-grid" className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
                <BookOpen className="w-3 h-3 mr-1" />
                Browse All
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Complete Resource Collection
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Filter by type, audience, or topic to find exactly what you need
              </p>
            </div>

            <ResourceFilters
              filters={filters}
              topics={topics}
              onFiltersChange={setFilters}
              totalCount={totalCount}
            />

            <div className="mt-12">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 animate-pulse"
                    >
                      <div className="h-48 bg-gray-200"></div>
                      <div className="p-6">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                        <div className="h-6 bg-gray-200 rounded mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-20 bg-white rounded-3xl shadow-lg">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-rose-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="h-10 w-10 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Error Loading Resources</h3>
                  <p className="text-lg text-gray-600 mb-6">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    Try Again
                  </Button>
                </div>
              ) : regularResources.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl shadow-lg">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No resources found</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Try adjusting your filters or search terms
                  </p>
                  <Button
                    onClick={() =>
                      setFilters({
                        search: '',
                        types: [],
                        audiences: [],
                        topics: [],
                        sortBy: 'newest',
                      })
                    }
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {regularResources.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 relative overflow-hidden">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.1) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />

          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Need Help?
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-lg text-white/95 mb-8 max-w-2xl mx-auto leading-relaxed">
              Our team is here to assist you with any questions about our resources or health sharing programs.
            </p>

            <Link to="/contact">
              <button className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 group">
                Contact Our Team
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default ResourceLibrary;
