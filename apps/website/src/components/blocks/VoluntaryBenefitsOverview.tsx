import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureLink {
  name: string;
  path: string;
  description: string;
}

const features: FeatureLink[] = [
  {
    name: 'Medical Cost Sharing',
    path: '/features/health-sharing',
    description: 'Community support for major medical expenses',
  },
  {
    name: 'Maternity',
    path: '/features/maternity-care',
    description: 'Comprehensive pregnancy and newborn care',
  },
  {
    name: 'Network Freedom',
    path: '/features/health-sharing',
    description: 'Visit any licensed provider nationwide',
  },
  {
    name: 'Virtual Primary Care',
    path: '/features/primary-care',
    description: 'Worldwide protection for acute medical needs',
  },
  {
    name: 'Virtual Urgent Care',
    path: '/features/urgent-care',
    description: '24/7/365 virtual care for urgent needs',
  },
  {
    name: 'Virtual Behavioral Health',
    path: '/features/mental-health',
    description: 'Professional support for emotional wellness',
  },
  {
    name: 'Pet Telehealth',
    path: '/features/pet-telehealth',
    description: '24/7 veterinary care for your pets',
  },
  {
    name: 'Concierge Healthcare Experience',
    path: '/features/membership-concierge',
    description: 'Personal support for all your healthcare needs',
  },
];

export const VoluntaryBenefitsOverview: React.FC = () => {

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-neutral-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Left Column - Image Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
              <div className="relative h-64 overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2"
                  alt="Healthcare professional"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-900/40 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-4 border-white/30 border-dashed animate-[spin_20s_linear_infinite]" />
                </div>
              </div>

              <div className="p-6 bg-white/95 backdrop-blur-sm">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="text-xl font-bold text-gray-900 mb-3"
                >
                  Healthcare Features Designed for You
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-sm text-gray-600 mb-4"
                >
                  Essential healthcare sharing options with flexibility and comprehensive support.
                </motion.p>

                <Link
                  to="/features"
                  className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl group"
                >
                  Explore All Benefits
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Features List */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-1 lg:order-2 space-y-6"
          >
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link
                    to={feature.path}
                    className="block group"
                  >
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-white hover:bg-blue-50 border-2 border-transparent hover:border-blue-200 transition-all duration-200">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-600 group-hover:scale-125 transition-transform duration-200" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-200 mb-1">
                          {feature.name}
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100"
            >
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold text-gray-900">Need help choosing?</span>{' '}
                Our licensed benefit specialists can guide you through each feature and help you find the perfect coverage for your needs.
              </p>
              <Link
                to="/contact"
                className="mt-4 inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors duration-200 group"
              >
                Schedule a consultation
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
