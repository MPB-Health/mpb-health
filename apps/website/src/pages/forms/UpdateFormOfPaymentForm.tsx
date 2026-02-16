import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CreditCard, Shield, ExternalLink, ArrowLeft, Phone, KeyRound, Mail, MousePointerClick, Lock, Smartphone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';

const PAYMENT_PORTAL_URL = 'https://www.1enrollment.com/MPBmembers';
const MPB_APP_URL = 'https://app.mpb.health/';

export default function UpdateFormOfPaymentForm() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);

  const handleOpenPortal = () => {
    window.open(PAYMENT_PORTAL_URL, '_blank', 'noopener,noreferrer');
    setShowModal(false);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <>
      <Helmet>
        <title>Update Payment Information | MPB Health</title>
        <meta
          name="description"
          content="Securely update your payment method through our payment portal."
        />
        <link rel="canonical" href="https://mpb.health/update-form-of-payment" />
      </Helmet>

      {/* ── Full Page Background ── */}
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#e8f3fc] via-[#d4e7f7] to-[#c4ddf2] pt-8 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00ek0xNiAzNmMtMi4yMSAwLTQgMS43OS00IDRzMS43OSA0IDQgNCA0LTEuNzkgNC00LTEuNzktNC00LTR6bTI4IDBjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00em0tMTItMTJjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-[#0a4c8f]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-[#0a4c8f]/15 rounded-full blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0a4c8f]/10 backdrop-blur-sm rounded-2xl mb-6 border border-[#0a4c8f]/20">
                <CreditCard className="w-10 h-10 text-[#0a4c8f]" />
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0a4c8f] mb-4 leading-tight">
                Update Your Payment
              </h1>

              <p className="text-xl sm:text-2xl text-[#0a4c8f]/80 max-w-3xl mx-auto leading-relaxed">
                Secure Payment Portal
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-[#0a4c8f]/90">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#0a4c8f]" />
                  <span className="text-sm font-medium">HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#0a4c8f]" />
                  <span className="text-sm font-medium">Secure &amp; Private</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Instructions Card Section */}
        <section className="py-12 sm:py-16 relative">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <Card className="p-8 sm:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0a4c8f]/10 rounded-xl mb-4">
                  <Shield className="w-8 h-8 text-[#0a4c8f]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">
                  How to Update Your Payment
                </h2>
                <p className="text-lg text-neutral-600">
                  Please read these simple steps before continuing.
                </p>
              </div>

              {/* Important notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
                <p className="text-base text-blue-900 leading-relaxed">
                  <strong>Important:</strong> For your security, the payment portal uses a
                  <strong> separate login</strong> from your MPB Health app. This is required
                  by HIPAA to keep your information safe.
                </p>
              </div>

              {/* Steps - large and clear */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-neutral-900 mb-5">
                  First Time? Set Up Your Login:
                </h3>
                <div className="space-y-5">
                  <div className="flex gap-4 items-start bg-neutral-50 rounded-xl p-5">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#0a4c8f] text-white font-bold rounded-full flex items-center justify-center text-lg">
                      1
                    </div>
                    <div>
                      <p className="text-lg text-neutral-900 font-semibold mb-1">
                        Click "Forgot Password"
                      </p>
                      <p className="text-base text-neutral-600">
                        On the portal login page, look for the <strong>"Forgot Password"</strong> link and click it.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start bg-neutral-50 rounded-xl p-5">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#0a4c8f] text-white font-bold rounded-full flex items-center justify-center text-lg">
                      2
                    </div>
                    <div>
                      <p className="text-lg text-neutral-900 font-semibold mb-1">
                        Enter Your Email and Member ID
                      </p>
                      <p className="text-base text-neutral-600">
                        Type in the <strong>email address</strong> you used when you signed up,
                        and your <strong>Member ID number</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start bg-neutral-50 rounded-xl p-5">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#0a4c8f] text-white font-bold rounded-full flex items-center justify-center text-lg">
                      3
                    </div>
                    <div>
                      <p className="text-lg text-neutral-900 font-semibold mb-1">
                        Check Your Email
                      </p>
                      <p className="text-base text-neutral-600">
                        You will receive an email with a link. <strong>Open your email</strong> and
                        <strong> click the link</strong> inside it.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start bg-neutral-50 rounded-xl p-5">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#0a4c8f] text-white font-bold rounded-full flex items-center justify-center text-lg">
                      4
                    </div>
                    <div>
                      <p className="text-lg text-neutral-900 font-semibold mb-1">
                        Create a New Password
                      </p>
                      <p className="text-base text-neutral-600">
                        Choose a password for the payment portal. <strong>Tip:</strong> Use the
                        same password as your MPB Health app so it's easy to remember.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reminders */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
                <p className="text-base text-amber-900 font-medium leading-relaxed">
                  Your MPB Health app password will <strong>not</strong> change.
                  The payment portal has its own separate password.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-8">
                <p className="text-base text-green-900 leading-relaxed">
                  <strong>Already have a portal login?</strong> Great! Just click the button
                  below and sign in with your portal email and password.
                </p>
              </div>

              {/* Alternate option */}
              <p className="text-base text-neutral-600 leading-relaxed mb-8 text-center">
                You can also update your payment information through the
                <strong> MPB Health app</strong> on your phone.
              </p>

              {/* CTA Buttons */}
              <div className="space-y-4">
                <button
                  onClick={handleOpenPortal}
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-[#0a4c8f] to-[#0d5fad] text-white font-bold rounded-xl hover:from-[#083d73] hover:to-[#0a4c8f] transition-all duration-300 shadow-lg hover:shadow-xl text-xl group"
                >
                  Go to Payment Portal
                  <ExternalLink className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-sm text-neutral-500 text-center">
                  This will open in a new window.
                </p>

                <a
                  href={MPB_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-[#0a4c8f]/10 text-[#0a4c8f] font-bold rounded-xl hover:bg-[#0a4c8f]/20 transition-all duration-300 text-lg group"
                >
                  <Smartphone className="w-6 h-6" />
                  Update via MPB Health App
                  <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>

                <a
                  href="tel:8558164650"
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-white text-[#0a4c8f] font-bold rounded-xl border-2 border-[#0a4c8f]/20 hover:border-[#0a4c8f]/40 hover:bg-[#0a4c8f]/5 transition-all duration-300 text-lg"
                >
                  <Phone className="w-6 h-6" />
                  Need Help? Call (855) 816-4650
                </a>
              </div>

              <div className="mt-8 text-center">
                <Link
                  to="/member"
                  className="inline-flex items-center gap-2 text-base text-neutral-500 hover:text-[#0a4c8f] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Go back to dashboard
                </Link>
              </div>
            </Card>

            <div className="mt-8 text-center text-base text-neutral-500">
              <p>
                Questions? Call us at{' '}
                <a href="tel:8558164650" className="text-[#0a4c8f] hover:underline font-medium">(855) 816-4650</a>
                {' '}or email{' '}
                <a href="mailto:support@mpb.health" className="text-[#0a4c8f] hover:underline font-medium">support@mpb.health</a>
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ── Modal Overlay ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="p-8 sm:p-10">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0a4c8f]/10 rounded-xl">
                  <CreditCard className="w-8 h-8 text-[#0a4c8f]" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-1">
                Secure Payment Portal
              </h2>
              <p className="text-base text-neutral-500 text-center mb-8">
                Please read before continuing
              </p>

              {/* Explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                <p className="text-base text-blue-900 leading-relaxed">
                  For your security, the payment portal uses a
                  <strong> separate login</strong> from your MPB Health app.
                  This keeps your information safe.
                </p>
              </div>

              {/* Instructions */}
              <h3 className="text-lg font-bold text-neutral-900 mb-4">
                First time? Here's what to do:
              </h3>
              <div className="space-y-4 mb-6">
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-9 h-9 bg-[#0a4c8f] text-white font-bold rounded-full flex items-center justify-center text-base">
                    1
                  </div>
                  <p className="text-base text-neutral-700 pt-1">
                    Click <strong>"Forgot Password"</strong> on the login page.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-9 h-9 bg-[#0a4c8f] text-white font-bold rounded-full flex items-center justify-center text-base">
                    2
                  </div>
                  <p className="text-base text-neutral-700 pt-1">
                    Type in your <strong>email</strong> and <strong>Member ID</strong>.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-9 h-9 bg-[#0a4c8f] text-white font-bold rounded-full flex items-center justify-center text-base">
                    3
                  </div>
                  <p className="text-base text-neutral-700 pt-1">
                    Check your email and <strong>click the link</strong> you receive.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-9 h-9 bg-[#0a4c8f] text-white font-bold rounded-full flex items-center justify-center text-base">
                    4
                  </div>
                  <p className="text-base text-neutral-700 pt-1">
                    Create a password. <strong>Tip:</strong> Use the same one as your app.
                  </p>
                </div>
              </div>

              {/* Reminder */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-900 font-medium">
                  Your app password will <strong>not</strong> change. This is a separate login.
                </p>
              </div>

              {/* Closing text */}
              <p className="text-base text-neutral-600 leading-relaxed mb-6 text-center">
                You can also update payment info in the <strong>MPB Health app</strong> on your phone.
              </p>

              {/* Portal login button */}
              <button
                onClick={handleOpenPortal}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-neutral-100 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-200 transition-colors text-base uppercase tracking-wide mb-3"
              >
                Open Portal Login Page
                <ExternalLink className="w-5 h-5" />
              </button>

              {/* Update via MPB Health App */}
              <a
                href={MPB_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#0a4c8f]/10 text-[#0a4c8f] font-semibold rounded-xl hover:bg-[#0a4c8f]/20 transition-colors text-base mb-3"
              >
                <Smartphone className="w-5 h-5" />
                Update via MPB Health App
              </a>

              {/* Contact Concierge */}
              <a
                href="tel:8558164650"
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-white text-[#0a4c8f] font-semibold rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors text-base mb-6"
              >
                <Phone className="w-5 h-5" />
                Need Help? Call Us
              </a>

              {/* Cancel / Continue */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-5 py-4 bg-white text-neutral-700 font-bold rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOpenPortal}
                  className="flex-1 px-5 py-4 bg-[#0a4c8f] text-white font-bold rounded-xl hover:bg-[#083d73] transition-colors text-base shadow-md"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
