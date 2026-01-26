import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ContactForm } from '../components/forms/ContactForm';

const Contact: React.FC = () => {
  const handleFormSubmit = (formData: any) => {
    console.log('Form submitted:', formData);
  };

  return (
    <>
      <SEOHead pathname="/contact" />

      {/* Hero Section - Same style as About Us */}
      <section className="relative pt-20 pb-16 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('/assets/ContactPicture.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/40 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h1 className="text-display-lg sm:text-display-xl font-bold text-neutral-900 mb-6 text-balance">
              <span className="bg-gradient-to-r from-neutral-900 via-primary to-neutral-800 bg-clip-text text-transparent">
                Get in
              </span>{" "}
              <span className="bg-gradient-to-r from-cyan-600 via-[#a3cc43] to-blue-600 bg-clip-text text-transparent">
                Touch
              </span>
            </h1>
            <p className="text-xl text-neutral-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Have questions about medical cost sharing? Our experienced healthcare advisors are here to help you find affordable, comprehensive coverage for you and your family.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-slide-up animate-delayed-2">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-neutral-900 tabular-nums mb-1">
                  Expert
                </div>
                <div className="text-sm text-neutral-600">Advisors</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-neutral-900 tabular-nums mb-1">
                  24 Hour
                </div>
                <div className="text-sm text-neutral-600">Response</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-neutral-900 tabular-nums mb-1">
                  Personalized
                </div>
                <div className="text-sm text-neutral-600">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-white">
        {/* Contact Information & Form Section */}
        <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-8">
                  Contact Information
                </h2>

                <div className="space-y-6">
                  {/* Phone */}
                  <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0">
                      <div className="inline-flex w-14 h-14 rounded-xl bg-primary/10 items-center justify-center">
                        <Phone className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-1">Phone</h3>
                      <a href="tel:8558164650" className="text-primary hover:text-primary/80 font-medium">
                        (855) 816-4650
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0">
                      <div className="inline-flex w-14 h-14 rounded-xl bg-accent/10 items-center justify-center">
                        <Mail className="h-7 w-7 text-accent" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-1">Email</h3>
                      <a href="mailto:info@mympb.com" className="text-accent hover:text-accent/80 font-medium">
                        info@mympb.com
                      </a>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0">
                      <div className="inline-flex w-14 h-14 rounded-xl bg-success/10 items-center justify-center">
                        <MapPin className="h-7 w-7 text-success" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-1">Office</h3>
                      <p className="text-neutral-600">
                        5301 N Federal Hwy Suite 155<br />
                        Boca Raton, FL 33487
                      </p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0">
                      <div className="inline-flex w-14 h-14 rounded-xl bg-primary/10 items-center justify-center">
                        <Clock className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-1">Hours</h3>
                      <p className="text-neutral-600">
                        Monday - Friday: 9:00 AM - 5:00 PM<br />
                        Saturday - Sunday: Closed
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <ContactForm onSubmit={handleFormSubmit} />
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-8 text-center">
              Visit Our Office
            </h2>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3570.887595886799!2d-80.08905842416968!3d26.358597377005556!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d8e2c3e3e3e3e3%3A0x1234567890abcdef!2s5301%20N%20Federal%20Hwy%20Suite%20155%2C%20Boca%20Raton%2C%20FL%2033487!5e0!3m2!1sen!2sus!4v1635789012345"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="MPB Health Office Location"
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export { Contact };
export default Contact;
