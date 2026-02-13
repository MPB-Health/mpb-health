import { Helmet } from 'react-helmet-async';
import { CreditCard, Shield, ExternalLink, ArrowLeft, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';

const PAYMENT_PORTAL_URL = 'https://www.1enrollment.com/MPBmembers';

export default function UpdateFormOfPaymentForm() {
  const handleOpenPortal = () => {
    window.open(PAYMENT_PORTAL_URL, '_blank', 'noopener,noreferrer');
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
                Update Payment Information
              </h1>

              <p className="text-xl sm:text-2xl text-[#0a4c8f]/80 max-w-3xl mx-auto leading-relaxed">
                Payment Portal
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-[#0a4c8f]/90">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#0a4c8f]" />
                  <span className="text-sm font-medium">HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-[#0a4c8f]" />
                  <span className="text-sm font-medium">Secure External Portal</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Instructions Card Section */}
        <section className="py-12 sm:py-16 relative">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <Card className="p-8 sm:p-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-[#0a4c8f]/10 rounded-xl mb-4">
                  <Shield className="w-7 h-7 text-[#0a4c8f]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
                  Before you continue
                </h2>
              </div>

              {/* Explanation */}
              <p className="text-neutral-700 leading-relaxed mb-6">
                If this is your first time using the payment portal, please note:
                because of HIPAA policies and for security reasons, the portal uses
                a separate login.
              </p>

              {/* Instructions */}
              <div className="mb-6">
                <p className="text-neutral-700 font-medium mb-4">
                  If you haven't accessed the portal before, please:
                </p>
                <ol className="space-y-3 text-neutral-700">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-[#0a4c8f]/10 text-[#0a4c8f] font-semibold rounded-full flex items-center justify-center text-sm">
                      1
                    </span>
                    <span className="pt-0.5">
                      Click on <strong>"Forgot Password"</strong> on the portal login page.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-[#0a4c8f]/10 text-[#0a4c8f] font-semibold rounded-full flex items-center justify-center text-sm">
                      2
                    </span>
                    <span className="pt-0.5">
                      Enter your <strong>email</strong> and <strong>Member ID</strong>.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-[#0a4c8f]/10 text-[#0a4c8f] font-semibold rounded-full flex items-center justify-center text-sm">
                      3
                    </span>
                    <span className="pt-0.5">
                      You will receive an email — click the link in the email.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-[#0a4c8f]/10 text-[#0a4c8f] font-semibold rounded-full flex items-center justify-center text-sm">
                      4
                    </span>
                    <span className="pt-0.5">
                      Set a new password. We recommend using the same password as your
                      app for convenience.
                    </span>
                  </li>
                </ol>
              </div>

              {/* Reminder */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800 font-medium">
                  Reminder: Changing your portal password will not affect your app login.
                </p>
              </div>

              {/* Closing text */}
              <p className="text-neutral-700 leading-relaxed mb-8">
                Then come back here and log in to the portal. If you need any help,
                contact our Concierge.
              </p>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleOpenPortal}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#0a4c8f] to-[#0d5fad] text-white font-semibold rounded-xl hover:from-[#083d73] hover:to-[#0a4c8f] transition-all duration-300 shadow-lg hover:shadow-xl text-lg group"
                >
                  Continue to Payment Portal
                  <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <a
                  href="tel:8558164650"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#0a4c8f] font-semibold rounded-xl border-2 border-[#0a4c8f]/20 hover:border-[#0a4c8f]/40 hover:bg-[#0a4c8f]/5 transition-all duration-300"
                >
                  <Phone className="w-5 h-5" />
                  Contact our Concierge
                </a>
              </div>

              {/* Go Back link */}
              <div className="mt-6 text-center">
                <Link
                  to="/member"
                  className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-[#0a4c8f] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go back to dashboard
                </Link>
              </div>
            </Card>

            {/* Additional help */}
            <div className="mt-8 text-center text-sm text-neutral-500">
              <p>
                Need help?{' '}
                <a
                  href="tel:8558164650"
                  className="text-[#0a4c8f] hover:underline"
                >
                  (855) 816-4650
                </a>{' '}
                or{' '}
                <a
                  href="mailto:support@mpb.health"
                  className="text-[#0a4c8f] hover:underline"
                >
                  support@mpb.health
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
