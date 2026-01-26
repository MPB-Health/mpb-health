import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserCircle, 
  ExternalLink, 
  ArrowRight, 
  Shield, 
  Heart,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Briefcase,
  Settings
} from 'lucide-react';

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/40">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-cyan-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-200/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-blue-100/80 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            MPB Health Member Center
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Welcome to MPB Health
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Access your member benefits or get started with a personalized health sharing plan
          </p>
        </div>

        {/* Two Card Layout */}
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Card 1: Existing Members */}
          <div className="group relative bg-white rounded-2xl shadow-lg shadow-blue-900/5 border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-300">
            {/* Card accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />
            
            <div className="p-8">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <UserCircle className="w-7 h-7 text-blue-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Existing Members
              </h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Access your member dashboard to manage your account, view your benefits, submit sharing requests, and more.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span>View your membership details</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span>Submit and track sharing requests</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span>Access member resources</span>
                </li>
              </ul>

              <a
                href="https://app.mpb.health"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Launch Member App
                <ExternalLink className="w-5 h-5" />
              </a>

              <p className="mt-4 text-center text-sm text-gray-500">
                Opens in a new window
              </p>
            </div>
          </div>

          {/* Card 2: New to MPB Health */}
          <div className="group relative bg-white rounded-2xl shadow-lg shadow-cyan-900/5 border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-cyan-900/10 transition-all duration-300">
            {/* Card accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 to-teal-500" />
            
            <div className="p-8">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-7 h-7 text-cyan-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                New to MPB Health?
              </h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Discover affordable health sharing plans tailored to your needs. Get a personalized quote in just 60 seconds.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Heart className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                  <span>Save up to 50% vs traditional insurance</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Heart className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                  <span>No networks - choose any provider</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Heart className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                  <span>Simple, transparent pricing</span>
                </li>
              </ul>

              <Link
                to="/get-started"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Build Your Membership
                <ArrowRight className="w-5 h-5" />
              </Link>

              <p className="mt-4 text-center text-sm text-gray-500">
                No commitment required
              </p>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 text-gray-600 mb-4">
            <HelpCircle className="w-5 h-5" />
            <span className="font-medium">Need assistance?</span>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Contact us at{' '}
            <a href="tel:855-816-4650" className="text-blue-600 hover:text-blue-700 font-medium">
              (855) 816-4650
            </a>
            {' '}or{' '}
            <a href="mailto:info@mympb.com" className="text-blue-600 hover:text-blue-700 font-medium">
              info@mympb.com
            </a>
          </p>
        </div>

        {/* Portal Access Links */}
        <div className="mt-8 w-full max-w-md">
          <p className="text-center text-sm text-gray-500 mb-4">Other portal access:</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link 
              to="/advisor/login" 
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 hover:border-blue-500 text-gray-700 hover:text-blue-600 font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Briefcase className="w-5 h-5" />
              Advisor Login
            </Link>
            <Link 
              to="/admin/login" 
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 hover:border-blue-500 text-gray-700 hover:text-blue-600 font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Settings className="w-5 h-5" />
              Admin Login
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6">
          <Link 
            to="/" 
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
