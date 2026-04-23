import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Mail, Phone, ExternalLink } from 'lucide-react';
import { siteMediaService } from '../lib/siteMediaService';

// Shared MPB Sales team booking page. Update via VITE_SALES_BOOKING_URL once
// Kiley provides the final Outlook group booking link. The fallback keeps the
// CTA functional (routes to the contact page) instead of a broken link.
const SALES_BOOKING_URL =
  (import.meta.env.VITE_SALES_BOOKING_URL as string | undefined) ||
  'https://mpb.health/contact?utm_source=welcome-email&utm_medium=email&utm_campaign=schedule-call';

const SALES_EMAIL = 'sales@mympb.com';
const SALES_PHONE_DISPLAY = '(855) 816-4650 ext 1';
const SALES_PHONE_TEL = '+18558164650,1';

export default function Welcome() {
  const [searchParams] = useSearchParams();
  const firstName = searchParams.get('name') || 'Friend';
  const [videoUrl, setVideoUrl] = useState('https://player.vimeo.com/video/1115561411?h=531f004487');

  useEffect(() => {
    const loadVideoUrl = async () => {
      const url = await siteMediaService.getVideoUrl('video_welcome_overview');
      setVideoUrl(url);
    };
    loadVideoUrl();
  }, []);

  return (
    <>
      <Helmet>
        <title>Welcome to MPB Health | Your Health-Share Options</title>
        <meta name="description" content="Thank you for visiting MPB Health. Explore affordable health-share options tailored to your needs." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
        {/* Hero Section */}
        <section className="relative py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Welcome Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-10 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Dear {firstName},
                </h1>
                <p className="text-blue-100 text-lg">
                  Thank you for visiting MPB Health to explore your health-share options.
                </p>
              </div>

              {/* Content */}
              <div className="px-8 py-10 space-y-8">
                {/* Pricing Info */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                  <p className="text-slate-700 text-lg leading-relaxed">
                    <span className="font-semibold text-blue-700">Individual programs</span> typically range from{' '}
                    <span className="font-bold text-slate-900">$160 to $350 per month</span>, while{' '}
                    <span className="font-semibold text-blue-700">family plans</span> range from{' '}
                    <span className="font-bold text-slate-900">$400 to $1,050 monthly</span>, depending on your specific medical needs.
                  </p>
                </div>

                {/* Benefits Description */}
                <div className="space-y-4">
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Health-share programs offer a great solution for unexpected medical bills. Our ability to custom tailor a program to your needs makes our health-share particularly beneficial for those looking to avoid pre-paying for benefits they'll never use.
                  </p>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    We offer a handful of the very best and unique healthshare options. Our advisors can answer any questions you have and help you figure out which one is the right fit for you. You can read more about them on our website or watch the short video below for a quick overview of how our programs work.
                  </p>
                </div>

                {/* Video Section */}
                <div className="rounded-2xl overflow-hidden shadow-lg bg-slate-900">
                  <div className="aspect-video">
                    <iframe
                      title="MPB Health Overview"
                      src={videoUrl}
                      className="w-full h-full"
                      frameBorder="0"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>

                {/* CTA Section */}
                <div className="text-center space-y-4 pt-4">
                  <p className="text-slate-600 text-lg">
                    Ready to talk it through? Click the calendar link below to book a call with the first available MPB Health advisor.
                  </p>
                  <p className="text-slate-500 font-medium">
                    There's no charge nor obligation.
                  </p>
                  <a
                    href={SALES_BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Calendar className="w-5 h-5" />
                    Schedule Your Free Consultation
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <p className="text-slate-500 text-sm">
                    Prefer to call?{' '}
                    <a href={`tel:${SALES_PHONE_TEL}`} className="text-blue-600 font-semibold hover:text-blue-700">
                      {SALES_PHONE_DISPLAY}
                    </a>
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 pt-8">
                  {/* Contact Card */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      {/* Avatar/Name */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg tracking-wide">
                          MPB
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">MPB Health Sales Team</h3>
                          <p className="text-slate-500 text-sm">Your Health Share Advisors</p>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <a
                          href={`mailto:${SALES_EMAIL}`}
                          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
                        >
                          <Mail className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">{SALES_EMAIL}</span>
                        </a>
                        <a
                          href={`tel:${SALES_PHONE_TEL}`}
                          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
                        >
                          <Phone className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">Sales: {SALES_PHONE_DISPLAY}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

