import React from 'react';
import { Helmet } from 'react-helmet-async';

const ScheduleWelcomeCall = () => {
  return (
    <>
      <Helmet>
        <title>Schedule a Welcome Call | MPB Health</title>
        <meta name="description" content="Schedule your welcome call with MPB Health to get started with your membership." />
        <script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript" async></script>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#e8f3fc] via-[#d4e7f7] to-[#c4ddf2] pt-8 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00ek0xNiAzNmMtMi4yMSAwLTQgMS43OS00IDRzMS43OSA0IDQgNCA0LTEuNzkgNC00LTEuNzktNC00LTR6bTI4IDBjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00em0tMTItMTJjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-[#0a4c8f]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-[#0a4c8f]/15 rounded-full blur-3xl"></div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0a4c8f]/10 backdrop-blur-sm rounded-2xl mb-6 border border-[#0a4c8f]/20">
                <svg className="w-10 h-10 text-[#0a4c8f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0a4c8f] mb-6 leading-tight">
                Schedule a Welcome Call
              </h1>

              <p className="text-xl sm:text-2xl text-[#0a4c8f]/80 max-w-3xl mx-auto leading-relaxed">
                Connect with our team to get started with your MPB Health membership
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-[#0a4c8f]/90">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0a4c8f]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Easy Scheduling</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0a4c8f]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Personal Guidance</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0a4c8f]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Flexible Times</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Calendly Section */}
        <section className="py-12 sm:py-16 pb-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mb-16">
            <div
              className="calendly-inline-widget"
              data-url="https://calendly.com/d/cx68-9pf-n2c/new-member-welcome-call"
              data-resize="true"
              style={{ minWidth: '320px', height: '700px' }}
            />
          </div>
        </section>
      </div>
    </>
  );
};

export { ScheduleWelcomeCall };
export default ScheduleWelcomeCall;
