import React from 'react';
import { Helmet } from 'react-helmet-async';

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | MPB Health</title>
        <meta name="description" content="MPB Health's Privacy Policy. Learn how we collect, use, and protect your personal data." />
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0a4c8f] mb-6 leading-tight">
                Privacy Policy
              </h1>

              <p className="text-xl sm:text-2xl text-[#0a4c8f]/80 max-w-3xl mx-auto leading-relaxed">
                Your privacy matters to us
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-[#0a4c8f]/90">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0a4c8f]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Data Protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0a4c8f]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Transparency</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0a4c8f]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Your Rights</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 sm:py-16 pb-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-slate-600 mb-6">
                <strong>Effective date:</strong> 5th day of February, 2024
              </p>

              <p className="text-slate-600 mb-6">
                https://mpb.health/ (the "Site") is owned and operated by MPowering Benefits INC. MPowering Benefits INC can be contacted at: <a href="mailto:info@mympb.com" className="text-[#0a4c8f] hover:underline">info@mympb.com</a>
              </p>

              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Purpose</h2>
              <p className="text-slate-600 mb-4">
                The purpose of this privacy policy (this "Privacy Policy") is to inform users of our Site of the following:
              </p>
              <ol className="list-decimal pl-6 text-slate-600 mb-6 space-y-2">
                <li>The personal data we will collect;</li>
                <li>Use of collected data;</li>
                <li>Who has access to the data collected;</li>
                <li>The rights of Site users; and</li>
                <li>The Site's cookie policy.</li>
              </ol>
              <p className="text-slate-600 mb-6">
                This Privacy Policy applies in addition to the terms and conditions of our Site.
              </p>

              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Consent</h2>
              <p className="text-slate-600 mb-4">
                By using our Site users agree that they consent to:
              </p>
              <ol className="list-decimal pl-6 text-slate-600 mb-6 space-y-2">
                <li>The conditions set out in this Privacy Policy; and</li>
                <li>The collection, use, and retention of the data listed in this Privacy Policy.</li>
              </ol>

              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Personal Data We Collect</h2>
              <p className="text-slate-600 mb-4">
                We only collect data that helps us achieve the purpose set out in this Privacy Policy. We will not collect any additional data beyond the data listed below without notifying you first.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Data Collected Automatically</h3>
              <p className="text-slate-600 mb-4">
                When you visit and use our Site, we may automatically collect and store the following information:
              </p>
              <ol className="list-decimal pl-6 text-slate-600 mb-6 space-y-2">
                <li>IP address;</li>
                <li>Location;</li>
                <li>Hardware and software details;</li>
                <li>Clicked links; and</li>
                <li>Content viewed.</li>
              </ol>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Data Collected in a Non-Automatic Way</h3>
              <p className="text-slate-600 mb-4">
                We may also collect the following data when you perform certain functions on our Site:
              </p>
              <ol className="list-decimal pl-6 text-slate-600 mb-6 space-y-2">
                <li>First and last name;</li>
                <li>Age;</li>
                <li>Date of birth;</li>
                <li>Sex;</li>
                <li>Email address;</li>
                <li>Phone number;</li>
                <li>Address; and</li>
                <li>Payment information.</li>
              </ol>

              <p className="text-slate-600 mb-4">
                This data may be collected using the following methods:
              </p>
              <ol className="list-decimal pl-6 text-slate-600 mb-6 space-y-2">
                <li>Google Analytics; and</li>
                <li>User imports personal information needed to purchase a healthcare plan.</li>
              </ol>

              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">How We Use Personal Data</h2>
              <p className="text-slate-600 mb-4">
                Data collected on our Site will only be used for the purposes specified in this Privacy Policy or indicated on the relevant pages of our Site. We will not use your data beyond what we disclose in this Privacy Policy.
              </p>

              <p className="text-slate-600 mb-4">
                The data we collect automatically is used for the following purposes:
              </p>
              <ol className="list-decimal pl-6 text-slate-600 mb-6 space-y-2">
                <li>Tailoring marketing campaigns;</li>
                <li>Improving user experience; and</li>
                <li>Improving product offering.</li>
              </ol>

              <p className="text-slate-600 mb-4">
                The data we collect when the user performs certain functions may be used for the following purposes:
              </p>
              <ol className="list-decimal pl-6 text-slate-600 mb-6 space-y-2">
                <li>Account management; and</li>
                <li>Tailoring marketing campaigns.</li>
              </ol>

              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Who We Share Personal Data With</h2>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Employees</h3>
              <p className="text-slate-600 mb-6">
                We may disclose user data to any member of our organization who reasonably needs access to user data to achieve the purposes set out in this Privacy Policy.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Third Parties</h3>
              <p className="text-slate-600 mb-4">
                We may share user data with the following third parties:
              </p>
              <ol className="list-decimal pl-6 text-slate-600 mb-6 space-y-2">
                <li>Health Sharing Partners; and</li>
                <li>Third Party Administrators.</li>
              </ol>

              <p className="text-slate-600 mb-4">
                We may share the following user data with third parties:
              </p>
              <ol className="list-decimal pl-6 text-slate-600 mb-6 space-y-2">
                <li>Personal information needed to manage healthcare plans.</li>
              </ol>

              <p className="text-slate-600 mb-4">
                We may share user data with third parties for the following purposes:
              </p>
              <ol className="list-decimal pl-6 text-slate-600 mb-6 space-y-2">
                <li>Account management.</li>
              </ol>

              <p className="text-slate-600 mb-6">
                Third parties will not be able to access user data beyond what is reasonably necessary to achieve the given purpose.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Other Disclosures</h3>
              <p className="text-slate-600 mb-4">
                We will not sell or share your data with other third parties, except in the following cases:
              </p>
              <ol className="list-decimal pl-6 text-slate-600 mb-6 space-y-2">
                <li>If the law requires it;</li>
                <li>If it is required for any legal proceeding;</li>
                <li>To prove or protect our legal rights; and</li>
                <li>To buyers or potential buyers of this company in the event that we seek to sell the company.</li>
              </ol>

              <p className="text-slate-600 mb-6">
                If you follow hyperlinks from our Site to another Site, please note that we are not responsible for and have no control over their privacy policies and practices.
              </p>

              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">How Long We Store Personal Data</h2>
              <p className="text-slate-600 mb-4">
                User data will be stored until the purpose the data was collected for has been achieved.
              </p>
              <p className="text-slate-600 mb-6">
                You will be notified if your data is kept for longer than this period.
              </p>

              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">How We Protect Your Personal Data</h2>
              <p className="text-slate-600 mb-6">
                While we take all reasonable precautions to ensure that user data is secure and that users are protected, there always remains the risk of harm. The Internet as a whole can be insecure at times and therefore we are unable to guarantee the security of user data beyond what is reasonably practical.
              </p>

              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Children</h2>
              <p className="text-slate-600 mb-6">
                We do not knowingly collect or use personal data from children under 13 years of age. If we learn that we have collected personal data from a child under 13 years of age, the personal data will be deleted as soon as possible. If a child under 13 years of age has provided us with personal data their parent or guardian may contact our privacy officer.
              </p>

              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">How to Access, Modify, Delete, or Challenge the Data Collected</h2>
              <p className="text-slate-600 mb-6">
                If you would like to know if we have collected your personal data, how we have used your personal data, if we have disclosed your personal data and to who we disclosed your personal data, or if you would like your data to be deleted or modified in any way, please contact our privacy officer at: <a href="mailto:info@mympb.com" className="text-[#0a4c8f] hover:underline">info@mympb.com</a>
              </p>

              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Do Not Track Notice</h2>
              <p className="text-slate-600 mb-6">
                Do Not Track ("DNT") is a privacy preference that you can set in certain web browsers. We do not track the users of our Site over time and across third party websites and therefore do not respond to browser-initiated DNT signals. We are not responsible for and cannot guarantee how any third parties who interact with our Site and your data will respond to DNT signals.
              </p>

              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Cookie Policy</h2>
              <p className="text-slate-600 mb-4">
                A cookie is a small file, stored on a user's hard drive by a website. Its purpose is to collect data relating to the user's browsing habits. You can choose to be notified each time a cookie is transmitted. You can also choose to disable cookies entirely in your internet browser, but this may decrease the quality of your user experience.
              </p>

              <p className="text-slate-600 mb-4">
                We use the following types of cookies on our Site:
              </p>
              <ol className="list-decimal pl-6 text-slate-600 mb-6 space-y-2">
                <li><strong>Functional cookies:</strong> Functional cookies are used to remember the selections you make on our Site so that your selections are saved for your next visits; and</li>
                <li><strong>Analytical cookies:</strong> Analytical cookies allow us to improve the design and functionality of our Site by collecting data on how you access our Site, for example data on the content you access, how long you stay on our Site, etc.</li>
              </ol>

              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Modifications</h2>
              <p className="text-slate-600 mb-6">
                This Privacy Policy may be amended from time to time in order to maintain compliance with the law and to reflect any changes to our data collection process. When we amend this Privacy Policy we will update the "Effective Date" at the top of this Privacy Policy. We recommend that our users periodically review our Privacy Policy to ensure that they are notified of any updates. If necessary, we may notify users by email of changes to this Privacy Policy.
              </p>

              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Contact Information</h2>
              <p className="text-slate-600 mb-4">
                If you have any questions, concerns or complaints, you can contact our privacy officer, Vinnie Tannous, at:
              </p>
              <div className="text-slate-600 mb-6">
                <p className="mb-2"><strong>MPB Health</strong></p>
                <p className="mb-2">5301 N Federal Hwy, Suite 155, Boca Raton, FL, 33487</p>
                <p><a href="mailto:info@mympb.com" className="text-[#0a4c8f] hover:underline">info@mympb.com</a></p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export { PrivacyPolicy };
export default PrivacyPolicy;
