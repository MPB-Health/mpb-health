import { useState, useEffect, useRef } from 'react';
import { Mail, Phone } from 'lucide-react';
import { portalSettingsService } from '@mpbhealth/advisor-core';

const COGNITO_FORM_EMBED_URL = 'https://www.cognitoforms.com/MPoweringBenefits1/ContactForm2';

export default function Contact() {
  const [contactPhone, setContactPhone] = useState('(610) 331-6423');
  const [contactEmail, setContactEmail] = useState('rebalarney@mympb.com');
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://www.cognitoforms.com') return;
      if (typeof e.data === 'object' && e.data.height && iframeRef.current) {
        iframeRef.current.style.height = `${e.data.height}px`;
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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

      {/* Cognito Form Card */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6 max-w-2xl">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-th-text-primary">Get In Touch</h2>
          <p className="text-sm text-th-text-tertiary mt-1">
            Have a question or want to get in touch? Fill out the form below, and we'll get back to you as soon as possible. Whether you need support, have a business inquiry, or just want to say hello, we're here to help!
          </p>
        </div>

        <iframe
          ref={iframeRef}
          src={COGNITO_FORM_EMBED_URL}
          title="Contact Form"
          className="w-full border-0 rounded-lg"
          style={{ minHeight: '500px' }}
          allow="payment"
        />
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
