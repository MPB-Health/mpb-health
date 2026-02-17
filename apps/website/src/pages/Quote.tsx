import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createClientLogger } from '@mpbhealth/utils';
import { LeadForm } from '../components/forms/LeadForm';
import { Button } from '../components/ui/button';

const log = createClientLogger('Quote');

const Quote: React.FC = () => {
  const handleFormSubmit = (formData: any) => {
    log.info('Form submitted:', formData);
    // In a real implementation, this would send data to your CRM/backend
  };

  return (
    <>
      <Helmet>
        <title>Get Your Free Health Sharing Quote - MPB Health</title>
        <meta 
          name="description" 
          content="Get your personalized health sharing quote in under 2 minutes. See how much you can save compared to traditional insurance with MPB Health."
        />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="mb-8">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Page header */}
          <div className="text-center mb-8">
            <h1 className="text-display-md font-bold text-neutral-900 mb-4">
              Get Your Free Quote
            </h1>
            <p className="text-lg text-neutral-600 max-w-xl mx-auto">
              Answer a few quick questions and we'll provide you with a personalized health sharing quote tailored to your family's needs.
            </p>
          </div>

          {/* Lead form */}
          <LeadForm onSubmit={handleFormSubmit} />

          {/* Trust indicators */}
          <div className="mt-8 text-center text-sm text-neutral-500">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <span>🔒 Your information is secure and private</span>
              <span className="hidden sm:inline">•</span>
              <span>📞 No spam calls, we'll only contact you about your quote</span>
              <span className="hidden sm:inline">•</span>
              <span>⚡ Get your quote in under 24 hours</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export { Quote };
export default Quote;