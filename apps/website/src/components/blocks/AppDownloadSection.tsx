import React from 'react';
import { Smartphone } from 'lucide-react';
import { APP_STORE_URLS, isAppAvailable } from '../../config/apps';

const AppDownloadSection = () => {
  return (
    <section className="relative py-20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl mb-6">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight text-neutral-900">
              Take Control of Your Healthcare with Our Easy-to-Use App
            </h2>
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
              Access your healthcare benefits anytime, anywhere. Manage your membership, submit expenses, and connect with support—all from your mobile device.
            </p>

            {/* App Store Badges */}
            <div className="flex flex-wrap gap-4 items-center">
              {isAppAvailable('appStore') ? (
                <a
                  href={APP_STORE_URLS.appStore!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform hover:scale-105 duration-300"
                >
                  <img
                    src="/assets/apple.png"
                    alt="Download on the App Store"
                    className="h-[60px] w-auto"
                  />
                </a>
              ) : (
                <div className="relative">
                  <img
                    src="/assets/apple.png"
                    alt="App Store - Coming Soon"
                    className="h-[60px] w-auto opacity-50"
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
                  className="transition-transform hover:scale-105 duration-300"
                >
                  <img
                    src="/assets/google.png"
                    alt="Get it on Google Play"
                    className="h-[60px] w-[180px]"
                  />
                </a>
              ) : (
                <div className="relative">
                  <img
                    src="/assets/google.png"
                    alt="Google Play - Coming Soon"
                    className="h-[60px] w-[180px] opacity-50"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-gray-900/75 text-white text-sm font-semibold rounded-lg">
                    Coming Soon
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Image/Visual */}
          <div className="relative">
            <div className="relative mx-auto max-w-sm">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 blur-3xl opacity-50"></div>

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
  );
};

export { AppDownloadSection };
