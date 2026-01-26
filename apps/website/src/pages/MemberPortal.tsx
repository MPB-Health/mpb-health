import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ExternalLink, Smartphone, CreditCard } from 'lucide-react';
import { Card } from '../components/ui/Card';

const MemberPortal = () => {
  return (
    <>
      <Helmet>
        <title>Member Portal - MPB Health</title>
        <meta
          name="description"
          content="Access your MPB Health member portal. Login to manage your healthcare membership, view benefits, and access your account."
        />
      </Helmet>

      <section className="relative bg-gradient-to-br from-primary/5 via-white to-primary/10 pt-20 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-display-lg sm:text-display-xl font-bold text-neutral-900 mb-6">
              Member Portal Access
            </h1>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Access your member dashboard to manage your healthcare benefits, view your coverage details, and stay connected with your care.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="p-8 hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="inline-flex w-14 h-14 rounded-xl bg-primary/10 items-center justify-center mb-6">
                <Smartphone className="h-7 w-7 text-primary" />
              </div>

              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                MPB Health APP
              </h2>

              <p className="text-neutral-600 mb-6 leading-relaxed">
                For memberships <strong>without</strong> Minimum Essential Coverage (non-MEC).
              </p>

              <div className="mb-8 pb-8 border-b border-neutral-200">
                <p className="text-sm font-semibold text-neutral-700 mb-3">
                  Available for these membership types:
                </p>
                <ul className="space-y-2">
                  {['Essentials', 'Care+', 'Direct'].map((plan, index) => (
                    <li key={index} className="flex items-center text-neutral-700">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      {plan}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto">
                <a
                  href="https://app.mpb.health/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 w-full group"
                >
                  <span className="flex items-center justify-center gap-2">
                    Access MPB Health APP
                    <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </a>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="inline-flex w-14 h-14 rounded-xl bg-accent/10 items-center justify-center mb-6">
                <CreditCard className="h-7 w-7 text-accent" />
              </div>

              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                HealthWallet
              </h2>

              <p className="text-neutral-600 mb-6 leading-relaxed">
                For memberships <strong>with</strong> Minimum Essential Coverage (MEC-Based).
              </p>

              <div className="mb-8 pb-8 border-b border-neutral-200">
                <p className="text-sm font-semibold text-neutral-700 mb-3">
                  Available for these membership types:
                </p>
                <ul className="space-y-2">
                  {['MEC+Essentials', 'Secure HSA'].map((plan, index) => (
                    <li key={index} className="flex items-center text-neutral-700">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      {plan}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto">
                <a
                  href="https://web.thehealthwallet.com/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 w-full group"
                >
                  <span className="flex items-center justify-center gap-2">
                    Access HealthWallet
                    <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </a>
              </div>
            </Card>
          </div>

          <div className="mt-16 text-center max-w-3xl mx-auto">
            <Card className="p-8 bg-neutral-50 border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">
                Need Help Accessing Your Portal?
              </h3>
              <p className="text-neutral-600 mb-6">
                If you're unsure which portal to use or need assistance logging in, our member support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="tel:8558164650"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold text-primary border-2 border-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
                >
                  Call (855) 816-4650
                </a>
                <a
                  href="mailto:support@mpb.health"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold text-neutral-700 border-2 border-neutral-300 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Email Support
                </a>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
};

export { MemberPortal };
export default MemberPortal;
