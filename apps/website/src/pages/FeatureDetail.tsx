import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, CheckCircle2, Phone, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import { healthcareFeatures } from '../data/healthcareFeaturesData';
import { Button } from '../components/ui/button';
import { FlowShell } from '../components/onboarding/FlowShell';

export const FeatureDetail: React.FC = () => {
  const { featureId } = useParams<{ featureId: string }>();
  const feature = healthcareFeatures.find((f) => f.id === featureId);
  const [showLemonadeEngine, setShowLemonadeEngine] = React.useState(false);
  const [activePathway, setActivePathway] = React.useState<'all' | 'hsa'>('all');

  if (!feature) {
    return <Navigate to="/features" replace />;
  }

  const Icon = feature.icon;

  return (
    <>
      <Helmet>
        <title>{feature.name} - Healthcare Features | MPB Health</title>
        <meta name="description" content={feature.shortDescription} />
        {feature.id === 'medical-weight-loss-support' && (
          <>
            <meta name="keywords" content="medical weight loss, GLP-1 medications, semaglutide, tirzepatide, virtual care, weight loss prescriptions, MPB Health, Rx Valet, telehealth weight loss" />
            <meta property="og:title" content="Medical Weight Loss Support | MPB Health" />
            <meta property="og:description" content={feature.shortDescription} />
            <meta property="og:image" content="/assets/diabetic-patient-using-insulin-pen-making-insulin-injection-home-young-woman-control-diabetes-diabetic-lifestyle.jpg" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Medical Weight Loss Support | MPB Health" />
            <meta name="twitter:description" content={feature.shortDescription} />
            <meta name="twitter:image" content="/assets/diabetic-patient-using-insulin-pen-making-insulin-injection-home-young-woman-control-diabetes-diabetic-lifestyle.jpg" />
          </>
        )}
      </Helmet>

      <div className="min-h-screen bg-white">
        <section className={`relative py-16 md:py-24 bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientTo} text-white overflow-hidden`}>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              {feature.id === 'medical-weight-loss-support' ? (
                <nav className="flex items-center gap-1.5 text-sm text-white/80">
                  <Link to="/" className="hover:text-white transition-colors">Home</Link>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <Link to="/features" className="hover:text-white transition-colors">Features</Link>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-white font-medium">Medical Weight Loss Support</span>
                </nav>
              ) : (
                <Link
                  to="/features"
                  className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to All Features
                </Link>
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl items-center justify-center">
                  <Icon className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                    {feature.name}
                  </h1>
                  <p className="text-xl sm:text-2xl text-white/90 mb-6">
                    {feature.tagline}
                  </p>
                  <p className="text-lg text-white/80 leading-relaxed">
                    {feature.detailedDescription}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-white text-neutral-900 hover:bg-neutral-100 shadow-lg"
                    onClick={() => {
                      const element = document.getElementById('get-started-flow');
                      element?.scrollIntoView({ behavior: 'smooth' });
                      setShowLemonadeEngine(true);
                    }}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    {feature.id === 'medical-weight-loss-support' ? 'Get Started' : 'Find My Perfect Plan'}
                  </Button>
                  <Button
                    size="lg"
                    className="bg-white text-neutral-900 hover:bg-neutral-100 shadow-lg"
                    asChild
                  >
                    <a href="tel:8558164650" className="inline-flex items-center">
                      <Phone className="w-5 h-5 mr-2" />
                      (855) 816-4650
                    </a>
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-white rounded-3xl blur-2xl opacity-20" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={feature.heroImage}
                    alt={feature.name}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-12 text-center">
              Key Benefits
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {feature.keyPoints.map((point, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
                >
                  <div className={`inline-flex w-12 h-12 rounded-xl ${feature.bgColor} items-center justify-center mb-4`}>
                    <CheckCircle2 className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">
                    {point.title}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {point.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {feature.id === 'medical-weight-loss-support' ? (
          <>
            <section className="py-16 bg-white">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 text-center">
                  How It Works
                </h2>
                <p className="text-center text-neutral-600 mb-10 max-w-2xl mx-auto">
                  Choose your pathway based on your membership type.
                </p>

                <div className="flex justify-center mb-10">
                  <div className="inline-flex rounded-xl bg-neutral-100 p-1">
                    <button
                      onClick={() => setActivePathway('all')}
                      className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                        activePathway === 'all'
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      All Memberships
                    </button>
                    <button
                      onClick={() => setActivePathway('hsa')}
                      className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                        activePathway === 'hsa'
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      Secure HSA Members
                    </button>
                  </div>
                </div>

                {activePathway === 'all' ? (
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-8 border border-teal-100">
                      <h3 className="text-xl font-bold text-neutral-900 mb-2">
                        MPB Health Virtual Care Access
                      </h3>
                      <p className="text-sm text-neutral-500 mb-6">Available to all memberships</p>
                      <div className="space-y-4">
                        {[
                          'Schedule a Virtual Primary Care appointment in the MPB Health app',
                          'Meet with a licensed provider for evaluation, and if appropriate receive a prescription',
                          'Fill your prescription at the pharmacy of your choice',
                          'Manage follow-ups directly with your provider'
                        ].map((step, index) => (
                          <div key={index} className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                              <span className="text-sm font-bold text-teal-700">{index + 1}</span>
                            </div>
                            <p className="text-neutral-700 pt-1">{step}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-neutral-500 italic mt-6 pt-4 border-t border-teal-200">
                        Virtual Care provides access to a prescription. It does not include Rx Valet discounted pricing.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 border border-emerald-100">
                      <h3 className="text-xl font-bold text-neutral-900 mb-2">
                        Rx Valet Program
                      </h3>
                      <p className="text-sm text-neutral-500 mb-6">Exclusive to Secure HSA members</p>
                      <div className="space-y-4">
                        {[
                          'Select Rx Valet inside the MPB Health App',
                          'Choose Mail Order — Order Here',
                          'Click Weight Loss Program at the top of the screen',
                          'Select either: "I have a prescription" or "I need a prescription"',
                          'If needed, complete the Qualifying Questionnaire',
                          'If approved, your prescription for compounded Semaglutide or compounded Tirzepatide is sent to the Rx Valet mail-order pharmacy',
                          'Your medication is cold shipped via 2-day delivery'
                        ].map((step, index) => (
                          <div key={index} className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                              <span className="text-sm font-bold text-emerald-700">{index + 1}</span>
                            </div>
                            <p className="text-neutral-700 pt-1">{step}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-neutral-500 italic mt-6 pt-4 border-t border-emerald-200">
                        Rx Valet provides member pricing and mail-order fulfillment.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="py-16 bg-neutral-50">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 text-center">
                  What's Included
                </h2>
                <p className="text-center text-neutral-600 mb-12 max-w-2xl mx-auto">
                  See what's available with your membership — and what Secure HSA members get in addition.
                </p>
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  <div className="bg-white rounded-2xl p-8 border-2 border-neutral-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-teal-600" />
                      </div>
                      <h3 className="text-lg font-bold text-neutral-900">For All Memberships</h3>
                    </div>
                    <ul className="space-y-3">
                      {[
                        'Virtual provider evaluation',
                        'Prescription eligibility determination',
                        'Ongoing medication management',
                        'Follow-up consultations',
                        'App-based scheduling and access'
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                          <span className="text-neutral-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-2xl p-8 border-2 border-emerald-300 shadow-sm relative">
                    <div className="absolute -top-3 right-6">
                      <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Secure HSA
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-bold text-neutral-900">Additional Benefits</h3>
                    </div>
                    <ul className="space-y-3">
                      {[
                        'Access to Rx Valet',
                        'Mail-order pharmacy fulfillment',
                        'Monthly dosage verification',
                        'Member pricing'
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="text-neutral-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold text-neutral-900 mb-6">
                  How It Works
                </h2>
                <div className="space-y-4">
                  {feature.howItWorks.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${feature.bgColor} flex items-center justify-center`}>
                        <span className={`text-sm font-bold ${feature.color}`}>
                          {index + 1}
                        </span>
                      </div>
                      <p className="text-neutral-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-neutral-900 mb-2">
                  What's Included
                </h2>
                {feature.id !== 'urgent-care' && feature.id !== 'mental-health' && (
                  <p className="text-sm text-neutral-500 italic mb-6">*After IUA is met</p>
                )}
                {(feature.id === 'urgent-care' || feature.id === 'mental-health') && (
                  <div className="mb-6" />
                )}
                <ul className="space-y-3">
                  {feature.membership.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-6 h-6 ${feature.color} flex-shrink-0 mt-0.5`} />
                      <span className="text-neutral-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
        )}

        <section className="py-16 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6 text-center">
              Memberships That Include This Feature
            </h2>
            <p className="text-center text-neutral-600 mb-12 max-w-3xl mx-auto">
              This feature is available on the following memberships. Find the right fit for your needs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {feature.eligiblePlans.map((plan, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl px-6 py-4 border-2 border-neutral-200 hover:border-blue-500 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-neutral-900">{plan}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
                asChild
              >
                <Link to="/plans" className="inline-flex items-center">
                  Compare All Plans
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

{feature.id === 'rx-benefits' && (
          <section className="py-16 bg-gradient-to-b from-white to-gray-50">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                  Your Prescription Savings Programs
                </h2>
                <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                  Access two powerful programs designed to help you save on medications and supplements
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold">RX Program</h3>
                    </div>
                    <p className="text-white/90 text-lg font-semibold">
                      Discounts up to 80% off retail
                    </p>
                  </div>
                  <div className="p-8">
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-700">Save up to 80% on prescription medications at over 65,000 pharmacies nationwide</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-700">No prior authorizations or formulary restrictions</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-700">Generic and brand-name medications included</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-700">Works at CVS, Walgreens, Walmart, Kroger, Costco, and most local pharmacies</span>
                      </li>
                    </ul>
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-sm text-neutral-600">
                        <span className="font-semibold text-neutral-900">Immediate savings</span> at the pharmacy counter with no paperwork or claims to file
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border-2 border-green-200 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold">Discounted Supplements</h3>
                    </div>
                    <p className="text-white/90 text-lg font-semibold">
                      30% off all orders
                    </p>
                  </div>
                  <div className="p-8">
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-700">Save 30% on high-quality vitamins and supplements</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-700">Premium brands and trusted formulations</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-700">Fast, reliable shipping direct to your door</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-700">Free shipping on orders over $50</span>
                      </li>
                    </ul>
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-sm text-neutral-600">
                        <span className="font-semibold text-neutral-900">Easy online ordering</span> with convenient home delivery for your wellness needs
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 border border-blue-100">
                <div className="text-center">
                  <h4 className="text-xl font-bold text-neutral-900 mb-3">
                    Combined Savings Add Up Fast
                  </h4>
                  <p className="text-neutral-700 max-w-3xl mx-auto leading-relaxed">
                    Members using both programs save an average of <span className="font-bold text-green-600">$1,200+ annually</span> on prescriptions and supplements. The discount card works instantly at checkout, and the supplement program ships directly to your home.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {feature.examples.length > 0 && (
          <section className="py-16 bg-white">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-12 text-center">
                Real-World Examples
              </h2>
              <div className="space-y-4">
                {feature.examples.map((example, index) => (
                  <div
                    key={index}
                    className="bg-neutral-50 rounded-xl p-6 border border-neutral-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${feature.bgColor} flex items-center justify-center`}>
                        <CheckCircle2 className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      <p className="text-neutral-700 pt-2 leading-relaxed">
                        {example}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {feature.disclaimer && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-neutral-500 italic">
                    * {feature.disclaimer}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="py-16 bg-neutral-50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-12 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {feature.faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm"
                >
                  <h3 className="text-lg font-bold text-neutral-900 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-neutral-700 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="get-started-flow" className="py-16 bg-gradient-to-br from-blue-50 via-white to-teal-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                Answer a few quick questions to find the perfect plan that includes {feature.name.toLowerCase()} and other features you need.
              </p>
            </div>

            {showLemonadeEngine ? (
              <FlowShell />
            ) : (
              <div className="text-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
                  onClick={() => setShowLemonadeEngine(true)}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Find My Perfect Plan
                </Button>
                <p className="text-sm text-neutral-500 mt-4">
                  Takes less than 2 minutes • No personal info required
                </p>
              </div>
            )}
          </div>
        </section>

        {feature.id === 'medical-weight-loss-support' && feature.disclaimer && (
          <section className="py-8 bg-white">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <p className="text-xs text-neutral-400 leading-relaxed text-center">
                {feature.disclaimer}
              </p>
            </div>
          </section>
        )}

        <section className="py-16 bg-white border-t border-neutral-200">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">
              {feature.id === 'medical-weight-loss-support'
                ? 'Ready to Take Control of Your Weight Loss Journey?'
                : 'Have Questions?'}
            </h2>
            <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
              {feature.id === 'medical-weight-loss-support'
                ? 'Schedule a virtual visit with a licensed provider today — right from the MPB Health app.'
                : 'Our healthcare specialists are here to help you understand your options and find the right coverage for your needs.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="outline"
                asChild
              >
                <a href="tel:8558164650" className="inline-flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Call (855) 816-4650
                </a>
              </Button>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
                asChild
              >
                <Link to={feature.id === 'medical-weight-loss-support' ? '/plans' : '/contact'}>
                  {feature.id === 'medical-weight-loss-support' ? 'Get Started' : 'Schedule a Consultation'}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default FeatureDetail;
