import React, { useState } from 'react';
import { Phone, Mail, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { subscribeToNewsletter } from '../../lib/newsletterService';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await subscribeToNewsletter(email, 'footer');

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

  return (
    <footer className="relative py-16 mt-auto bg-gradient-to-b from-neutral-900 to-neutral-950 overflow-hidden">
      {/* Subtle top border with gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top section: Logo and Disclaimer */}
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-1">
            <img
              src="/assets/MPB-Health-White.png"
              alt="MPB Health"
              className="h-16 w-auto"
            />
          </div>
          <div className="md:col-span-3">
            <p className="text-neutral-300 italic text-sm leading-relaxed">
              MPB Health is your gateway to qualified Health Share Programs. While MPB
              Health is not a Health Share Organization or a Health Care Sharing Ministry
              (HCSM), we provide the membership services and support that give you access to
              organizations that share in members' medical expenses. Through MPB Health, you
              can experience affordable, community-based healthcare that works as an
              alternative to traditional insurance.
            </p>
          </div>
        </div>

        {/* Bottom section: Contact, Links (2 columns), Subscribe */}
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Contact Us</h4>
            {/*
              NAP block (Name, Address, Phone) for Local/GEO SEO. Marked up with
              schema.org Organization microdata so crawlers can reliably extract
              each address component (streetAddress, locality, region, postalCode,
              country) — independent of the JSON-LD MedicalOrganization /
              LocalBusiness schema injected into <head>.
            */}
            <address
              className="not-italic space-y-3"
              itemScope
              itemType="https://schema.org/MedicalOrganization"
            >
              <meta itemProp="name" content="MPB Health" />
              <meta itemProp="url" content="https://mpb.health/" />

              <div className="flex items-center gap-3 text-neutral-300">
                <Phone className="w-5 h-5 text-[#0a4d90]" />
                <a
                  href="tel:+18558164650"
                  className="hover:text-[#0a4d90] transition-colors"
                  itemProp="telephone"
                  content="+1-855-816-4650"
                >
                  (855) 816-4650
                </a>
              </div>
              <div className="flex items-center gap-3 text-neutral-300">
                <Mail className="w-5 h-5 text-[#0a4d90]" />
                <a
                  href="mailto:info@mympb.com"
                  className="hover:text-[#0a4d90] transition-colors"
                  itemProp="email"
                >
                  info@mympb.com
                </a>
              </div>
              <div
                className="flex items-start gap-3 text-neutral-300"
                itemProp="address"
                itemScope
                itemType="https://schema.org/PostalAddress"
              >
                <MapPin className="w-5 h-5 text-[#0a4d90] flex-shrink-0 mt-1" aria-hidden="true" />
                <span>
                  <span itemProp="streetAddress">5301 N Federal Hwy, Suite 155</span>,{' '}
                  <span itemProp="addressLocality">Boca Raton</span>,{' '}
                  <span itemProp="addressRegion">FL</span>{' '}
                  <span itemProp="postalCode">33487</span>
                  <meta itemProp="addressCountry" content="US" />
                </span>
              </div>
            </address>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-4">Links</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/privacy-policy"
                  className="text-neutral-300 hover:text-[#0a4d90] transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms-and-conditions"
                  className="text-neutral-300 hover:text-[#0a4d90] transition-colors"
                >
                  Terms and Conditions
                </a>
              </li>
              <li>
                <a
                  href="/state-notices"
                  className="text-neutral-300 hover:text-[#0a4d90] transition-colors"
                >
                  State Notices
                </a>
              </li>
              <li>
                <Link
                  to="/washington-statement"
                  className="text-neutral-300 hover:text-[#0a4d90] transition-colors"
                >
                  Washington Statement
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-4 invisible">Links</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/faq"
                  className="text-neutral-300 hover:text-[#0a4d90] transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <Link
                  to="/download-app"
                  className="text-neutral-300 hover:text-[#0a4d90] transition-colors"
                >
                  App Download
                </Link>
              </li>

            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-4">
              Subscribe to Our Blog
            </h4>
            <p className="text-neutral-300 mb-4 text-sm leading-relaxed">
              Stay informed and empowered—subscribe to our blog for expert tips, wellness
              insights, and updates on smarter, more affordable healthcare solutions.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-neutral-700 bg-neutral-800/50 text-neutral-100 placeholder:text-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a4d90] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
              {message && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-900/50 text-green-200 border border-green-700'
                    : 'bg-red-900/50 text-red-200 border border-red-700'
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
          </div>
        </div>
      </div>
    </footer>
  );
};

export { Footer };