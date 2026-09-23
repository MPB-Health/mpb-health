import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CreditCard, Shield, ExternalLink, ArrowLeft, Phone, Lock, Smartphone, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { APP_STORE_URLS } from '../../config/apps';

const PAYMENT_PORTAL_URL = 'https://www.1enrollment.com/MPBmembers';
const MPB_APP_URL = 'https://app.mpb.health/';
const CONCIERGE_TEL = 'tel:+18005192969';
const CONCIERGE_DISPLAY = '1-800-519-2969';

const APP_STEPS = [
  'Sign in to the MPB Health App.',
  'Go to Profile.',
  'Select Payment.',
  'Enter your new payment information and submit.',
];

function PaymentMethodGuide() {
  const openPortal = () => {
    window.open(PAYMENT_PORTAL_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-bold text-neutral-900 mb-4">
          Update in the MPB Health App
        </h3>
        <ol className="space-y-3 mb-5">
          {APP_STEPS.map((step, index) => (
            <li key={step} className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-[#0a4c8f] text-white font-bold rounded-full flex items-center justify-center text-sm">
                {index + 1}
              </span>
              <span className="text-base text-neutral-700 pt-1">{step}</span>
            </li>
          ))}
        </ol>
        <a
          href={MPB_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-4 bg-[#0a4c8f] text-white font-bold rounded-xl hover:bg-[#083d73] transition-colors text-[13px] sm:text-base tracking-normal sm:tracking-wide text-balance shadow-md"
        >
          <Smartphone className="w-5 h-5" aria-hidden="true" />
          UPDATE IN MPB HEALTH APP
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
      </section>

      <section className="border-t border-neutral-200 pt-8">
        <h3 className="text-lg font-bold text-neutral-900 mb-2">
          Having Trouble With the App?
        </h3>
        <p className="text-base text-neutral-600 leading-relaxed mb-4">
          You can also securely update your payment method through the E123 Payment Portal.
        </p>
        <button
          type="button"
          onClick={openPortal}
          className="w-full inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-4 bg-white text-[#0a4c8f] font-bold rounded-xl border-2 border-[#0a4c8f]/25 hover:border-[#0a4c8f]/50 hover:bg-[#0a4c8f]/5 transition-colors text-[13px] sm:text-base tracking-normal sm:tracking-wide text-balance"
        >
          UPDATE THROUGH PAYMENT PORTAL
        </button>
        <p className="text-sm text-neutral-500 leading-relaxed mt-3">
          The Payment Portal uses a separate login from the MPB Health App.
        </p>
      </section>

      <section className="border-t border-neutral-200 pt-8">
        <h3 className="text-lg font-bold text-neutral-900 mb-4">
          Don't Have the MPB Health App?
        </h3>
        {APP_STORE_URLS.googlePlay ? (
          <a
            href={APP_STORE_URLS.googlePlay}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-4 bg-[#0a4c8f]/10 text-[#0a4c8f] font-bold rounded-xl hover:bg-[#0a4c8f]/20 transition-colors text-[13px] sm:text-base tracking-normal sm:tracking-wide text-balance"
          >
            DOWNLOAD THE APP
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        ) : null}
        <p className="text-sm text-neutral-500 text-center mt-3">Google Play</p>
      </section>

      <section className="border-t border-neutral-200 pt-8">
        <h3 className="text-lg font-bold text-neutral-900 mb-4">Need Help?</h3>
        <a
          href={CONCIERGE_TEL}
          className="w-full inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-4 bg-white text-[#0a4c8f] font-bold rounded-xl border-2 border-[#0a4c8f]/20 hover:border-[#0a4c8f]/40 hover:bg-[#0a4c8f]/5 transition-colors text-[13px] sm:text-base tracking-normal sm:tracking-wide text-balance"
        >
          <Phone className="w-5 h-5" aria-hidden="true" />
          CALL MPB HEALTH CONCIERGE
        </a>
        <p className="text-center mt-3">
          <a href={CONCIERGE_TEL} className="text-[#0a4c8f] font-semibold hover:underline">
            {CONCIERGE_DISPLAY}
          </a>
        </p>
      </section>
    </div>
  );
}

export default function UpdateFormOfPaymentForm() {
  const [showModal, setShowModal] = useState(true);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeModal = useCallback(() => setShowModal(false), []);

  useEffect(() => {
    if (!showModal) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    node?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
        return;
      }
      if (event.key !== 'Tab' || !node) return;

      const focusable = node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [showModal, closeModal]);

  return (
    <>
      <Helmet>
        <title>Update Payment Information | MPB Health</title>
        <meta
          name="description"
          content="Update your MPB Health payment method in the app, or through the E123 payment portal."
        />
        <link rel="canonical" href="https://mpb.health/update-form-of-payment" />
      </Helmet>

      <div className="min-h-screen bg-white">
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
                Update Your Payment Method
              </h1>

              <p className="text-xl sm:text-2xl text-[#0a4c8f]/80 max-w-3xl mx-auto leading-relaxed">
                The easiest way is through the MPB Health App.
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

        <section className="py-12 sm:py-16 relative">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <Card className="p-8 sm:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0a4c8f]/10 rounded-xl mb-4">
                  <Smartphone className="w-8 h-8 text-[#0a4c8f]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">
                  Update Your Payment Method
                </h2>
                <p className="text-lg text-neutral-600">
                  The easiest way to update your payment method is through the MPB Health App.
                </p>
              </div>

              <PaymentMethodGuide />

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
                <a href={CONCIERGE_TEL} className="text-[#0a4c8f] hover:underline font-medium">
                  {CONCIERGE_DISPLAY}
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] outline-none"
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 inline-flex items-center justify-center w-10 h-10 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a4c8f]"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 sm:p-10">
              <div className="flex justify-center mb-5">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0a4c8f]/10 rounded-xl">
                  <CreditCard className="w-8 h-8 text-[#0a4c8f]" />
                </div>
              </div>

              <h2 id={titleId} className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-3">
                Update Your Payment Method
              </h2>
              <p className="text-base text-neutral-600 text-center leading-relaxed mb-8">
                The easiest way to update your payment method is through the MPB Health App.
              </p>

              <PaymentMethodGuide />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
