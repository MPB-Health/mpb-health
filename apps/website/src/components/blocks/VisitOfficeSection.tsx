import React from 'react';
import { MapPin, Phone, Clock, Mail, ExternalLink } from 'lucide-react';
import { COMPANY_CONTACT, getPhoneLink, getEmailLink } from '../../config/company';
import { Card, CardContent } from '../ui/Card';

interface VisitOfficeSectionProps {
  variant?: 'default' | 'compact';
  className?: string;
}

const VisitOfficeSection: React.FC<VisitOfficeSectionProps> = ({
  variant = 'default',
  className = ''
}) => {
  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 ${className}`}>
        <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Visit Our Office
        </h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-neutral-900">{COMPANY_CONTACT.officeName}</p>
              <p className="text-neutral-700">{COMPANY_CONTACT.officeAddress}</p>
              <p className="text-neutral-700">
                {COMPANY_CONTACT.officeCity}, {COMPANY_CONTACT.officeState} {COMPANY_CONTACT.officeZip}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-neutral-600 flex-shrink-0" />
            <a
              href={getPhoneLink()}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              {COMPANY_CONTACT.officePhone}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-neutral-600 flex-shrink-0" />
            <p className="text-neutral-700">{COMPANY_CONTACT.officeHours}</p>
          </div>

          <div className="pt-3">
            <a
              href={COMPANY_CONTACT.officeMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Get Directions
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className={`py-16 bg-gradient-to-b from-white to-gray-50 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Visit Our Office
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Stop by our office to speak with a member of our team in person
          </p>
        </div>

        <Card className="max-w-3xl mx-auto border-2 border-blue-200">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900">Address</h3>
                  </div>
                  <p className="text-neutral-700 ml-12">
                    {COMPANY_CONTACT.officeName}<br />
                    {COMPANY_CONTACT.officeAddress}<br />
                    {COMPANY_CONTACT.officeCity}, {COMPANY_CONTACT.officeState} {COMPANY_CONTACT.officeZip}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900">Phone</h3>
                  </div>
                  <a
                    href={getPhoneLink()}
                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline ml-12 text-lg"
                  >
                    {COMPANY_CONTACT.officePhone}
                  </a>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900">Hours</h3>
                  </div>
                  <p className="text-neutral-700 ml-12">
                    {COMPANY_CONTACT.officeHours}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 mb-6">
                  <h4 className="font-bold text-neutral-900 mb-3">Need Directions?</h4>
                  <p className="text-neutral-700 text-sm mb-4">
                    Click below to open our location in Google Maps
                  </p>
                  <a
                    href={COMPANY_CONTACT.officeMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <MapPin className="w-4 h-4" />
                    Get Directions
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                  <h4 className="font-bold text-neutral-900 mb-3">Have Questions?</h4>
                  <p className="text-neutral-700 text-sm mb-4">
                    Reach out to us via email
                  </p>
                  <a
                    href={getEmailLink()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Mail className="w-4 h-4" />
                    Email Us
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export { VisitOfficeSection };
