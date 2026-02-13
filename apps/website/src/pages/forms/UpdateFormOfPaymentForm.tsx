import { Helmet } from 'react-helmet-async';
import { CreditCard, ExternalLink, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PAYMENT_PORTAL_URL = 'https://www.1enrollment.com/MPBmembers';

export default function UpdateFormOfPaymentForm() {
  const navigate = useNavigate();

  const handleOpenPortal = () => {
    window.open(PAYMENT_PORTAL_URL, '_blank', 'noopener,noreferrer');
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

      {/* Full-viewport dimmed backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        {/* Modal card */}
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
          <div className="p-8 sm:p-10">
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-[#0a4c8f]/10 rounded-xl">
                <CreditCard className="w-7 h-7 text-[#0a4c8f]" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-neutral-900 text-center mb-1">
              Payment Portal
            </h1>
            <p className="text-sm text-neutral-500 text-center mb-6">
              Before you continue
            </p>

            {/* Explanation */}
            <p className="text-neutral-700 leading-relaxed mb-5 text-sm">
              If this is your first time using the payment portal, please note:
              because of HIPAA policies and for security reasons, the portal uses
              a separate login.
            </p>

            {/* Instructions */}
            <p className="text-neutral-700 font-medium mb-3 text-sm">
              If you haven't accessed the portal before, please:
            </p>
            <ul className="space-y-2.5 mb-5 text-sm text-neutral-700">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-neutral-400 flex-shrink-0" />
                Click on <strong>"Forgot Password"</strong> on the portal login page.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-neutral-400 flex-shrink-0" />
                Enter your email and Member ID.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-neutral-400 flex-shrink-0" />
                You will receive an email — click the link in the email.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-neutral-400 flex-shrink-0" />
                Set a new password. We recommend using the same password as your app for convenience.
              </li>
            </ul>

            {/* Reminder */}
            <p className="text-sm text-neutral-500 mb-5">
              Reminder: Changing your portal password will not affect your app login.
            </p>

            {/* Closing text with app mention */}
            <p className="text-sm text-neutral-700 leading-relaxed mb-6">
              You can also update your payment information through the MPB Health app.
              Or use the button below to log in to the secure payment portal. If you
              need any help, contact our Concierge.
            </p>

            {/* Portal login button */}
            <button
              onClick={handleOpenPortal}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-colors text-sm uppercase tracking-wide mb-3"
            >
              For Portal Login
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Contact Concierge */}
            <a
              href="tel:8558164650"
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#0a4c8f] font-medium rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors text-sm mb-6"
            >
              <Phone className="w-4 h-4" />
              Contact our Concierge
            </a>

            {/* Cancel / Continue buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-5 py-3 bg-white text-neutral-700 font-semibold rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleOpenPortal}
                className="flex-1 px-5 py-3 bg-[#7c3aed] text-white font-semibold rounded-xl hover:bg-[#6d28d9] transition-colors text-sm shadow-md"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
