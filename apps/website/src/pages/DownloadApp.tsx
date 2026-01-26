import React from 'react';
import { Smartphone, Shield, Clock, Heart, CheckCircle } from 'lucide-react';
import { APP_STORE_URLS, isAppAvailable } from '../config/apps';

const DownloadApp = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure Access',
      description: 'View your membership details and benefits securely',
    },
    {
      icon: Clock,
      title: 'Quick Submissions',
      description: 'Submit medical expenses in seconds with photo capture',
    },
    {
      icon: Heart,
      title: 'Find Providers',
      description: 'Search for healthcare providers in your network',
    },
    {
      icon: CheckCircle,
      title: 'Track Status',
      description: 'Monitor your sharing requests in real-time',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, #0a4d90 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          ></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-neutral-900">
                Download the{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-600">
                  MPB Health
                </span>{' '}
                App
              </h1>

              <p className="text-xl text-neutral-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Take control of your healthcare anytime, anywhere. Manage your
                membership, submit expenses, find providers, and connect with
                support—all from your mobile device.
              </p>

              {/* App Store Badges */}
              <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-start">
                {isAppAvailable('appStore') ? (
                  <a
                    href={APP_STORE_URLS.appStore!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-105 duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                  >
                    <img
                      src="/assets/apple.png"
                      alt="Download on the App Store"
                      className="h-[56px] sm:h-[64px] w-auto"
                    />
                  </a>
                ) : (
                  <div className="relative">
                    <img
                      src="/assets/apple.png"
                      alt="App Store - Coming Soon"
                      className="h-[56px] sm:h-[64px] w-auto opacity-50"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-gray-900/75 text-white text-sm font-semibold rounded-lg">
                      Coming Soon
                    </span>
                  </div>
                )}

                {isAppAvailable('googlePlay') ? (
                  <a
                    href={APP_STORE_URLS.googlePlay!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-105 duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                  >
                    <img
                      src="/assets/google.png"
                      alt="Get it on Google Play"
                      className="h-[56px] sm:h-[64px] w-auto"
                    />
                  </a>
                ) : (
                  <div className="relative">
                    <img
                      src="/assets/google.png"
                      alt="Google Play - Coming Soon"
                      className="h-[56px] sm:h-[64px] w-auto opacity-50"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-gray-900/75 text-white text-sm font-semibold rounded-lg">
                      Coming Soon
                    </span>
                  </div>
                )}
              </div>

              <p className="mt-6 text-sm text-neutral-500">
                Available for iOS and Android devices
              </p>
            </div>

            {/* Right - Phone Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative max-w-sm lg:max-w-md">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-cyan-500/20 blur-3xl opacity-60 -z-10 scale-110"></div>

                {/* Phone Image */}
                <img
                  src="/assets/CellPhone.png"
                  alt="MPB Health Mobile App"
                  className="relative w-full h-auto drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Everything You Need in One App
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Our mobile app puts your healthcare management at your fingertips
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl bg-neutral-50 hover:bg-primary/5 transition-colors duration-300"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl mb-4">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-primary to-primary/90">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Download the MPB Health app today and take the first step toward
            simpler, more accessible healthcare management.
          </p>

          <div className="flex flex-wrap gap-4 items-center justify-center">
            {isAppAvailable('appStore') && (
              <a
                href={APP_STORE_URLS.appStore!}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105 duration-300"
              >
                <img
                  src="/assets/apple.png"
                  alt="Download on the App Store"
                  className="h-[56px] w-auto"
                />
              </a>
            )}

            {isAppAvailable('googlePlay') && (
              <a
                href={APP_STORE_URLS.googlePlay!}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105 duration-300"
              >
                <img
                  src="/assets/google.png"
                  alt="Get it on Google Play"
                  className="h-[56px] w-auto"
                />
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DownloadApp;

