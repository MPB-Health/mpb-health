import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, CheckCircle2, AlertCircle, ArrowRight, Calculator, Phone } from 'lucide-react';
import { HealthcarePlanCategoryWithDetails } from '../lib/supabase';
import { getPlanCategoryBySlug } from '../lib/planCategoryService';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/Card';

const PlanCategoryDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<HealthcarePlanCategoryWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      if (!slug) {
        setError('No category specified');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPlanCategoryBySlug(slug);

        if (!data) {
          setError('Category not found');
        } else {
          setCategory(data);
        }
      } catch (err) {
        console.error('Error loading category:', err);
        setError('Failed to load category details');
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [slug]);

  const handleGetQuote = () => {
    const element = document.getElementById('calculator');
    if (element) {
      navigate('/', { replace: false });
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading plan details...</p>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Plan Not Found</h1>
          <p className="text-neutral-600 mb-6">{error || 'The plan you are looking for does not exist.'}</p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{category.title} | MPB Health</title>
        <meta name="description" content={category.description} />
        <meta property="og:title" content={`${category.title} | MPB Health`} />
        <meta property="og:description" content={category.description} />
        <meta property="og:image" content={category.image_url} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="relative bg-white border-b border-neutral-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <Link
              to="/"
              className="inline-flex items-center text-sm text-neutral-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Plans
            </Link>
          </div>
        </div>

        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className={`inline-flex w-16 h-16 ${category.icon_bg} rounded-2xl items-center justify-center`}>
                  <div className="h-8 w-8 text-neutral-700" />
                </div>

                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
                    {category.title}
                  </h1>
                  <p className="text-xl text-neutral-600 mb-4">
                    {category.subtitle}
                  </p>
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm">
                    {category.recommendations}
                  </div>
                </div>

                <p className="text-lg text-neutral-700 leading-relaxed">
                  {category.description}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    size="lg"
                    onClick={handleGetQuote}
                    className={`flex-1 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r ${category.gradient} hover:opacity-90 text-white`}
                  >
                    <Calculator className="mr-2 h-5 w-5" />
                    Get Your Quote
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="flex-1 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Link to="/contact" className="inline-flex items-center">
                      <Phone className="mr-2 h-5 w-5" />
                      Talk to an Advisor
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className={`absolute -inset-4 bg-gradient-to-r ${category.gradient} rounded-3xl blur-2xl opacity-20`} />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={category.image_url}
                    alt={category.image_alt}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                  Who This Plan Is For
                </h2>
                <ul className="space-y-4">
                  {category.profiles.map((profile) => (
                    <li key={profile.id} className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5 text-blue-600" />
                      <span className="text-neutral-700">{profile.profile_text}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-8">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                  What You Get
                </h2>
                <ul className="space-y-4">
                  {category.included_features.map((feature) => (
                    <li key={feature.id} className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5 text-success-600" />
                      <span className="text-neutral-700">{feature.feature_text}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Card className="p-8 bg-accent-50 border-l-4 border-accent-500">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-8 w-8 text-accent-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                    Important Considerations
                  </h2>
                  <ul className="space-y-3">
                    {category.excluded_features.map((feature) => (
                      <li key={feature.id} className="text-neutral-700">
                        • {feature.feature_text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Card className={`p-8 md:p-12 bg-gradient-to-r ${category.gradient} text-white`}>
              <h2 className="text-3xl font-bold mb-4">
                Best For:
              </h2>
              <p className="text-lg leading-relaxed opacity-95 mb-8">
                {category.best_for}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={handleGetQuote}
                  className="bg-white text-blue-700 hover:bg-neutral-50 shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center"
                >
                  Calculate My Rate
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Link to="/individuals-and-families" className="inline-flex items-center">
                    Compare All Plans
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl mb-8 text-primary-50 max-w-2xl mx-auto">
                Our healthcare advisors are here to help you choose the perfect plan for your needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handleGetQuote}
                  className="bg-white text-primary-700 hover:bg-neutral-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8 py-6 inline-flex items-center"
                >
                  Get Your Personalized Quote
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-primary-700 shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8 py-6"
                >
                  <Link to="/contact" className="inline-flex items-center">
                    Speak with an Advisor
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-primary-100">
                No credit card required • Get your quote in under 2 minutes
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default PlanCategoryDetail;
