import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { subscribeToNewsletter } from '../../lib/newsletterService';

interface NewsletterSubscribeProps {
  source?: string;
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
}

export const NewsletterSubscribe: React.FC<NewsletterSubscribeProps> = ({
  source = 'blog',
  variant = 'default',
  className = ''
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await subscribeToNewsletter(email, source);

      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      });

      if (result.success) {
        setEmail('');
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <Mail className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-neutral-900">Stay Informed</h3>
        </div>
        <p className="text-sm text-neutral-600 mb-4">
          Get healthcare tips, savings strategies, and industry updates delivered to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-4 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </button>
          {message && (
            <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-3 h-3 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </form>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`${className}`}>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mt-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-blue-600 to-cyan-700 rounded-2xl p-8 text-white ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
          <Mail className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-bold">Subscribe to Our Newsletter</h3>
      </div>
      <p className="text-blue-100 mb-6">
        Join thousands of readers who stay informed about healthcare savings, wellness tips, and industry insights.
        Get expert advice delivered straight to your inbox.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder:text-blue-200 focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSubmitting ? 'Subscribing...' : 'Subscribe Now'}
          </button>
        </div>
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-500/20 text-white border border-green-400/30'
              : 'bg-red-500/20 text-white border border-red-400/30'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </form>
      <p className="text-xs text-blue-200 mt-4">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  );
};
