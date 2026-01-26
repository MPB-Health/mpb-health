import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { unsubscribeFromNewsletter, getSubscriptionStatus } from '../lib/newsletterService';
import { SEOHead } from '../components/SEOHead';

const NewsletterUnsubscribe = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'not-found'>('idle');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [selectedReason, setSelectedReason] = useState('');

  useEffect(() => {
    if (emailParam) {
      handleUnsubscribe(emailParam);
    }
  }, [emailParam]);

  const handleUnsubscribe = async (emailToUnsubscribe: string) => {
    if (!emailToUnsubscribe || !emailToUnsubscribe.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setIsProcessing(true);
    setStatus('idle');

    try {
      const subscription = await getSubscriptionStatus(emailToUnsubscribe);

      if (!subscription) {
        setStatus('not-found');
        setMessage('This email address is not subscribed to our newsletter.');
        setIsProcessing(false);
        return;
      }

      if (subscription.status === 'unsubscribed') {
        setStatus('not-found');
        setMessage('This email address is already unsubscribed.');
        setIsProcessing(false);
        return;
      }

      const result = await unsubscribeFromNewsletter(emailToUnsubscribe);

      if (result.success) {
        setStatus('success');
        setMessage('You have been successfully unsubscribed from our newsletter.');
      } else {
        setStatus('error');
        setMessage(result.message);
      }
    } catch (_error) {
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUnsubscribe(email);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Unsubscribe feedback:', { email, reason: selectedReason, feedback });
    setFeedback('');
    setSelectedReason('');
  };

  const unsubscribeReasons = [
    'Too many emails',
    'Content not relevant',
    'Never signed up',
    'Privacy concerns',
    'Email quality',
    'Other'
  ];

  return (
    <>
      <SEOHead
        title="Unsubscribe from Newsletter - MPB Health"
        description="Manage your newsletter subscription preferences"
      />

      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-8">
              <Mail className="w-16 h-16 mx-auto mb-4 text-blue-600" />
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Newsletter Unsubscribe
              </h1>
              <p className="text-neutral-600">
                We're sorry to see you go. Manage your subscription below.
              </p>
            </div>

            {status === 'idle' && !emailParam && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    disabled={isProcessing}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  {isProcessing ? 'Processing...' : 'Unsubscribe'}
                </Button>
              </form>
            )}

            {status === 'success' && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">Successfully Unsubscribed</h3>
                    <p className="text-green-700">{message}</p>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-neutral-900">Help Us Improve</h3>
                  <p className="text-sm text-neutral-600">
                    We'd love to know why you're leaving. Your feedback helps us improve.
                  </p>

                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Reason for unsubscribing
                      </label>
                      <select
                        value={selectedReason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a reason...</option>
                        {unsubscribeReasons.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Additional feedback (optional)
                      </label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                        placeholder="Tell us more..."
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full"
                    >
                      Submit Feedback
                    </Button>
                  </form>
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm text-neutral-600 mb-4">
                    Changed your mind?
                  </p>
                  <Link
                    to="/?resubscribe=true"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Re-subscribe to our newsletter
                  </Link>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Unsubscribe Failed</h3>
                    <p className="text-red-700">{message}</p>
                  </div>
                </div>

                <Button
                  onClick={() => setStatus('idle')}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            )}

            {status === 'not-found' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">Not Found</h3>
                    <p className="text-yellow-700">{message}</p>
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Return to Homepage
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-neutral-200">
              <div className="text-center space-y-2">
                <p className="text-sm text-neutral-600">
                  Need help? <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-medium">Contact us</Link>
                </p>
                <p className="text-xs text-neutral-500">
                  You will stop receiving emails within 24-48 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewsletterUnsubscribe;
