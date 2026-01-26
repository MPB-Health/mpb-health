import React from 'react';
import { Helmet } from 'react-helmet-async';

const WashingtonStatement = () => {
  return (
    <>
      <Helmet>
        <title>Washington Statement | MPB Health</title>
        <meta name="description" content="Washington state-specific disclosures for MPB Health medical cost sharing programs." />
      </Helmet>

      <div className="min-h-screen bg-white">
        <section className="relative bg-gradient-to-br from-[#e8f3fc] via-[#d4e7f7] to-[#c4ddf2] pt-8 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00ek0xNiAzNmMtMi4yMSAwLTQgMS43OS00IDRzMS43OSA0IDQgNCA0LTEuNzkgNC00LTEuNzktNC00LTR6bTI4IDBjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00em0tMTItMTJjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-[#0a4c8f]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-[#0a4c8f]/15 rounded-full blur-3xl"></div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0a4c8f]/10 backdrop-blur-sm rounded-2xl mb-6 border border-[#0a4c8f]/20">
                <svg className="w-10 h-10 text-[#0a4c8f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0a4c8f] mb-6 leading-tight">
                Washington Statement
              </h1>

              <p className="text-xl sm:text-2xl text-[#0a4c8f]/80 max-w-3xl mx-auto leading-relaxed">
                Important disclosures for Washington state residents
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8 rounded-r-lg">
                <h2 className="text-2xl font-bold text-blue-900 mt-0 mb-3">Washington State Notice</h2>
                <p className="text-blue-800 mb-0">
                  This page contains important information for Washington state residents regarding medical cost sharing programs.
                </p>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">Important Disclosure</h3>
                  <p className="text-neutral-700 leading-relaxed">
                    Medical cost sharing programs are not insurance and do not guarantee payment of medical expenses.
                    Members are responsible for the payment of their own medical expenses. The organization facilitates
                    the sharing of medical expenses between members.
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">State-Specific Requirements</h3>
                  <p className="text-neutral-700 leading-relaxed mb-4">
                    Washington state law requires specific disclosures regarding health care sharing ministries and
                    medical cost sharing programs. Members should be aware that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                    <li>Participation in a medical cost sharing program is voluntary</li>
                    <li>Medical expenses may not be shared in all circumstances</li>
                    <li>Pre-membership conditions may not be eligible for sharing</li>
                    <li>There is no guarantee of payment for any medical expenses</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">Contact Information</h3>
                  <p className="text-neutral-700 leading-relaxed">
                    For questions about Washington state requirements or to discuss your specific situation,
                    please contact our team at <a href="mailto:support@mpb.health" className="text-blue-600 hover:text-blue-700 font-medium">support@mpb.health</a> or
                    call us at <a href="tel:8558164650" className="text-blue-600 hover:text-blue-700 font-medium">(855) 816-4650</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default WashingtonStatement;
