import React from 'react';
import { Helmet } from 'react-helmet-async';
import { FlowShell } from '../components/onboarding/FlowShell';
import { Clock, Shield, CheckCircle2 } from 'lucide-react';

export function GetStarted() {
  return (
    <>
      <Helmet>
        <title>Get Started - Find Your Perfect Plan | MPB Health</title>
        <meta
          name="description"
          content="Answer a few quick questions to find the perfect health sharing plan for you and your family. Takes less than 2 minutes."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 mb-6 shadow-lg border border-blue-100">
              <span className="text-blue-600 font-semibold tracking-wide">QUICK START</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Find Your Perfect Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Answer a few quick questions and we'll recommend the best health sharing plan for your needs.
              <span className="block mt-2 text-lg font-medium text-blue-600">Takes less than 2 minutes</span>
            </p>

            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">No Personal Info Required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Less Than 2 Minutes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-5 w-5 text-teal-600" />
                <span className="font-medium">100% Free & Secure</span>
              </div>
            </div>
          </div>

          <FlowShell />

          <div className="text-center mt-12">
            <p className="text-sm text-gray-500">
              Have questions?{' '}
              <a href="tel:8558164650" className="text-blue-600 hover:text-blue-700 font-medium">
                Call (855) 816-4650
              </a>{' '}
              or{' '}
              <a href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
                contact us
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default GetStarted;
