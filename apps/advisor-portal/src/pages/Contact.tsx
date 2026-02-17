import { useState, useEffect } from 'react';
import { Mail, Send, Phone, User, MessageSquare } from 'lucide-react';
import { portalSettingsService } from '@mpbhealth/advisor-core';
import { supabase } from '@mpbhealth/database';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contactPhone, setContactPhone] = useState('(561) 922-9647');
  const [contactEmail, setContactEmail] = useState('support@mpb.health');

  // Load dynamic contact settings
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await portalSettingsService.getMultipleSettings([
          'contact_phone',
          'contact_email',
        ]);
        if (!cancelled) {
          if (settings.contact_phone) setContactPhone(settings.contact_phone);
          if (settings.contact_email) setContactEmail(settings.contact_email);
        }
      } catch (err) {
        console.error('Failed to load contact settings:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from('contact_submissions').insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        message: formData.message,
        source: 'advisor_portal',
      });

      if (error) {
        console.error('Contact submission error:', error);
      }
    } catch (err) {
      console.error('Failed to submit contact form:', err);
    }

    setSubmitting(false);
    setSubmitted(true);
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-surface-tertiary">
          <Mail className="w-6 h-6 text-th-text-tertiary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Contact</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Get in touch with us
          </p>
        </div>
      </div>

      {/* Contact form card */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6 max-w-2xl">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-th-text-primary">Get In Touch</h2>
          <p className="text-sm text-th-text-tertiary mt-1">
            Have a question or want to get in touch? Fill out the form below, and we'll get back to you as soon as possible. Whether you need support, have a business inquiry, or just want to say hello, we're here to help!
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <Send className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-th-text-primary mb-1">Message Sent!</h3>
            <p className="text-sm text-th-text-tertiary mb-4">
              Thank you for reaching out. We'll get back to you soon.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-sm text-th-accent-600 font-medium hover:underline"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-th-text-secondary mb-1.5">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-2.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-th-text-secondary mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-th-text-secondary mb-1.5">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  className="w-full pl-10 pr-4 py-2.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-th-text-secondary mb-1.5">
                Message
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-th-text-tertiary" />
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  className="w-full pl-10 pr-4 py-2.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-th-accent-600 hover:bg-th-accent-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Contact info */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6 max-w-2xl">
        <p className="text-sm text-th-text-tertiary font-medium">
          Empowering Healthcare Advisors – Making a Difference Every Day!
        </p>
        <div className="flex items-center gap-2 mt-3 text-sm text-th-text-secondary">
          <Phone className="w-4 h-4 text-th-text-tertiary" />
          <a href={`tel:${contactPhone.replace(/\D/g, '')}`} className="hover:text-th-accent-600">{contactPhone}</a>
        </div>
        <div className="flex items-center gap-2 mt-2 text-sm text-th-text-secondary">
          <Mail className="w-4 h-4 text-th-text-tertiary" />
          <a href={`mailto:${contactEmail}`} className="hover:text-th-accent-600">{contactEmail}</a>
        </div>
      </div>
    </div>
  );
}
