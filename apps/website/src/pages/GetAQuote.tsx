import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Clock, Phone, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LeadForm } from '../components/forms/LeadForm';
import { createClientLogger } from '@mpbhealth/utils';
import { generateOrganizationSchema } from '../lib/schemaMarkup';

const log = createClientLogger('GetAQuote');

const GetAQuote: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Get Your Free Health Sharing Quote in 2 Minutes | MPB Health</title>
        <meta
          name="description"
          content="Save up to 60% on healthcare. Get a free, no-obligation health sharing quote in 2 minutes. 50,000+ families trust MPB Health. Plans from $107/mo."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://mpb.health/get-a-quote" />

        {/* Open Graph */}
        <meta property="og:title" content="Free Health Sharing Quote | Save Up to 60% | MPB Health" />
        <meta property="og:description" content="See how much you could save with community health sharing. Free quote, no obligation, response within 24 hours." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mpb.health/get-a-quote" />
        <meta property="og:site_name" content="MPB Health" />
        <meta property="og:image" content="https://mpb.health/assets/MPB-Health-No-background.png?v=2" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Health Sharing Quote | Save Up to 60%" />
        <meta name="twitter:description" content="50,000+ families save on healthcare with MPB Health. Get your free quote now." />

        {/* Organization Schema */}
        <script type="application/ld+json">
          {JSON.stringify(generateOrganizationSchema())}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        {/* Header Section */}
        <div className="bg-white border-b border-neutral-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
              Get Your Free Quote
            </h1>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto mb-8">
              Complete the form below and we'll send you a personalized health sharing quote within 24 hours
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Takes 2-3 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Your information is secure</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span>No obligation</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden p-6">
                <LeadForm onSubmit={(formData) => log.info('Quote form submitted', formData)} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* What Happens Next */}
                <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">
                    What Happens Next?
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">Submit Your Information</p>
                        <p className="text-sm text-neutral-600">Complete the form with your details</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">We Review Your Needs</p>
                        <p className="text-sm text-neutral-600">Our team analyzes your requirements</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">Receive Your Quote</p>
                        <p className="text-sm text-neutral-600">Get a personalized quote within 24 hours</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        4
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">Speak with an Advisor</p>
                        <p className="text-sm text-neutral-600">Discuss your options with a specialist</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Need Help? */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">
                    Need Help?
                  </h3>
                  <p className="text-sm text-neutral-700 mb-4">
                    Our team is here to answer any questions you have about health sharing or the quote process.
                  </p>
                  <a
                    href="tel:+18558164650"
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    Call (855) 816-4650
                  </a>
                  <p className="text-xs text-neutral-600 text-center mt-2">
                    Monday - Friday, 9am - 6pm EST
                  </p>
                </div>

                {/* Trust & Security */}
                <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">
                    Your Privacy Matters
                  </h3>
                  <div className="space-y-3 text-sm text-neutral-600">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Your information is encrypted and secure</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>We'll never sell your data to third parties</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>No spam calls or emails - we respect your privacy</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>HIPAA-compliant data handling</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-4">
                Join Thousands of Members Who've Made the Switch
              </h2>
              <p className="text-xl text-blue-100 mb-6">
                Save an average of 40% on healthcare costs while getting better coverage
              </p>
              <div className="flex flex-wrap justify-center gap-8 text-lg">
                <div>
                  <div className="text-4xl font-bold">50,000+</div>
                  <div className="text-blue-100">Families Served</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">$240M+</div>
                  <div className="text-blue-100">In Shared Medical Bills</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">4.9/5</div>
                  <div className="text-blue-100">Customer Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export { GetAQuote };
export default GetAQuote;
