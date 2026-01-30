import React from 'react';
import { Helmet } from 'react-helmet-async';
import { DollarSign, Users, TrendingUp, Shield, FileText, Heart, Brain, Clock, Stethoscope, CheckSquare, Building2, Pill, Plus, Dna, PawPrint, Headphones as HeadphonesIcon, Infinity as InfinityIcon, GitCompare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PlanComparisonGuide } from '../components/blocks/PlanComparisonGuide';
import { Card } from '../components/ui/Card';
import { SocialProof } from '../components/blocks/SocialProof';
import { EnhancedBusinessPricingSection } from '../components/blocks/EnhancedBusinessPricingSection';
import BusinessRateCalculator from '../components/BusinessRateCalculator';
import { BusinessesOrganizationsHero } from '../components/blocks/BusinessesOrganizationsHero';
import { generateHealthSharePlanSchema, generateOrganizationSchema, generateServiceSchema } from '../lib/schemaMarkup';

const BusinessesOrganizations = () => {
  // Generate structured data for business plans
  const mecEssentialsSchema = generateHealthSharePlanSchema(
    'MEC+ Essentials',
    'Minimum Essential Coverage plan satisfying ACA employer mandate requirements. Affordable preventive care solution for businesses.',
    125,
    195,
    ['ACA Compliant', 'Employer Mandate Satisfaction', 'Preventive Care', 'Telemedicine', 'Business Solution']
  );

  const secureHSABusinessSchema = generateHealthSharePlanSchema(
    'Secure HSA Business',
    'HSA-compatible health sharing for businesses seeking tax-advantaged healthcare solutions for employees.',
    239,
    1070,
    ['HSA Compatible', 'Tax Advantages', 'Employee Benefits', 'Medical Cost Sharing', 'Family Coverage Options']
  );

  const orgSchema = generateOrganizationSchema();
  const serviceSchema = generateServiceSchema();

  const whyChooseItems = [
    {
      icon: DollarSign,
      title: 'Cost-Sharing for Self Employed',
      description:
        'Replace hefty premiums with a fixed monthly share that pools funds for eligible medical costs—saving 40–60% versus typical plans.',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      icon: Users,
      title: 'Share Monthly Contributions',
      description:
        'Each participating employee or self-employed member pays a fixed share into a communal pool. Contributions fund eligible medical expenses for all members—HSA Compatible',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: TrendingUp,
      title: 'Tax-Friendly Options',
      description:
        'Qualifying Individuals may deduct the MEC portion of their membership, regardless of whether they are independent contractors, freelancers, or traditional employees. Be sure to consult your tax advisor for guidance specific to your situation.',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const services = [
    { icon: Shield, title: 'Protection From Large Medical Expenses', fullWidth: true, color: 'text-success', bgColor: 'bg-success/10' },
    { icon: Brain, title: '$0 Virtual Behavioral Health', color: 'text-primary', bgColor: 'bg-primary/10' },
    { icon: Clock, title: '$0 Unlimited 24/7/365 Virtual Urgent Care', color: 'text-accent', bgColor: 'bg-accent/10' },
    { icon: Stethoscope, title: '$0 Continuous & Personalized Virtual Primary Care', color: 'text-success', bgColor: 'bg-success/10' },
    { icon: CheckSquare, title: 'Preventive Services that Satisfy Federal Health Mandates', color: 'text-primary', bgColor: 'bg-primary/10' },
    { icon: Building2, title: 'Maternity Sharing Prenatal, delivery, postnatal, and newborn care', note: 'Applicable with eligibility requirements', color: 'text-accent', bgColor: 'bg-accent/10' },
    { icon: Pill, title: 'Over 1,000 medications at $0 or under $14.95', color: 'text-success', bgColor: 'bg-success/10' },
    { icon: Plus, title: 'Save on Prescriptions at Nationwide Pharmacies', color: 'text-primary', bgColor: 'bg-primary/10' },
    { icon: Heart, title: 'Save 30% on High-Quality Vitamins & Supplements', color: 'text-accent', bgColor: 'bg-accent/10' },
    { icon: HeadphonesIcon, title: 'Personalized Advocacy and Expert Member Support', color: 'text-success', bgColor: 'bg-success/10' },
    { icon: Dna, title: 'Genetic Testing Discounts', color: 'text-primary', bgColor: 'bg-primary/10' },
    { icon: PawPrint, title: '$0 Unlimited Virtual Pet Care', color: 'text-accent', bgColor: 'bg-accent/10' },
  ];

  const featureItems = [
    {
      icon: Shield,
      title: 'Provider Freedom',
      description:
        'Members enjoy the freedom to choose their own providers without being restricted by narrow networks or penalized for going out of network. (Please note: Memberships that include MEC benefits do follow a network since these services are provided at no cost).',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: InfinityIcon,
      title: 'No Annual or Lifetime Caps',
      description:
        "Unlike many traditional plans, MPB Health's cost-sharing programs don't impose yearly or lifetime maximums on eligible expenses.",
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: FileText,
      title: 'Transparent Sharing Guidelines',
      description:
        'Detailed, easy-to-understand rules outline which medical expenses are eligible, how sharing amounts are applied, and any limits—ensuring members know exactly what to expect.',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Business Health Sharing Solutions | Employer Healthcare | MPB Health</title>
        <meta
          name="description"
          content="Affordable health sharing for businesses, self-employed professionals, and 1099 contractors. ACA-compliant MEC+ plans, HSA-compatible options. Save 40-60% on employee healthcare."
        />
        <meta name="keywords" content="business health sharing, employer healthcare, ACA compliant, MEC plans, self-employed health, 1099 contractor health" />
        <link rel="canonical" href="https://mpb.health/businesses-and-organizations" />

        {/* Open Graph */}
        <meta property="og:title" content="Business Health Sharing Solutions | MPB Health" />
        <meta property="og:description" content="Affordable health sharing for businesses. ACA-compliant options, HSA-compatible plans." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mpb.health/businesses-and-organizations" />
        <meta property="og:site_name" content="MPB Health" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Business Health Sharing Solutions | MPB Health" />

        {/* Organization Schema */}
        <script type="application/ld+json">
          {JSON.stringify(orgSchema)}
        </script>

        {/* Service Schema */}
        <script type="application/ld+json">
          {JSON.stringify(serviceSchema)}
        </script>

        {/* Product Schemas */}
        <script type="application/ld+json">
          {JSON.stringify(mecEssentialsSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(secureHSABusinessSchema)}
        </script>
      </Helmet>

      <BusinessesOrganizationsHero />

      {/* Why Choose Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900">
              Why Choose Our Healthcare Sharing Membership?
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl transform rotate-3"></div>
              <img
                src="/assets/businessTeamWorking.jpg"
                alt="Professional accounting firm office"
                width={600}
                height={500}
                loading="lazy"
                decoding="async"
                className="relative rounded-2xl shadow-2xl w-full h-auto object-contain"
              />
            </div>

            <div className="space-y-6">
              {whyChooseItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className={`inline-flex items-center justify-center w-14 h-14 ${item.bgColor} rounded-xl`}>
                          <Icon className={`w-7 h-7 ${item.color}`} />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-neutral-900 mb-2">{item.title}</h4>
                        <p className="text-neutral-600 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Complete Protection Section */}
      <section className="py-16 bg-gradient-to-b from-white to-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Complete Protection
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              <strong>
                One stop access to telehealth, cost sharing, virtual behavioral health, and more.
              </strong>{' '}
              Explore our services—features vary by membership.
            </p>
          </div>

          {/* Full-width benefit */}
          <div className="mb-8">
            {services.slice(0, 1).map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-4">
                    <div className={`inline-flex w-14 h-14 rounded-xl ${service.bgColor} items-center justify-center`}>
                      <Icon className={`h-7 w-7 ${service.color}`} />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-neutral-900">
                        {service.title}
                      </h4>
                      {service.note && (
                        <p className="text-neutral-600 text-sm mt-2">{service.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Three-column grid benefits */}
          <div className="grid md:grid-cols-3 gap-6">
            {services.slice(1).map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-4">
                    <div className={`inline-flex w-14 h-14 rounded-xl ${service.bgColor} items-center justify-center`}>
                      <Icon className={`h-7 w-7 ${service.color}`} />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-neutral-900">
                        {service.title}
                      </h4>
                      {service.note && (
                        <p className="text-neutral-600 text-sm mt-2">{service.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Choose Your Membership - Enhanced Version */}
      <EnhancedBusinessPricingSection />

      {/* Plan Comparison CTA */}
      <section className="py-16 bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-primary-100 p-8 md:p-12">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg">
                <GitCompare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary-900">
                Need Help Comparing Plans?
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                View all plans side-by-side to find the perfect fit for your business healthcare needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  to="/compare-plans"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 transform hover:scale-105"
                >
                  <GitCompare className="w-5 h-5 mr-2" />
                  Compare Plans Online
                </Link>
                <a
                  href="/docs/plan-comparison-guide.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-primary-300 text-primary-700 font-semibold rounded-xl hover:bg-primary-50 hover:border-primary-400 transition-all duration-300"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Download Comparison Guide
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Plan Comparison Guide */}
      <PlanComparisonGuide 
        title="Compare All Plans Side-by-Side"
        subtitle="See exactly what each plan offers to find the perfect fit for your business"
      />

      {/* Business Rate Calculator */}
      <BusinessRateCalculator />

       {/* Features of Our Memberships Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900">
              Features of Our Memberships
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-stretch">
            <div className="flex flex-col gap-6 justify-center">
              {featureItems.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className={`inline-flex items-center justify-center w-14 h-14 ${feature.bgColor} rounded-xl`}>
                          <Icon className={`w-7 h-7 ${feature.color}`} />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-neutral-900 mb-2">{feature.title}</h4>
                        <p className="text-neutral-600 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="relative h-full min-h-[700px] lg:min-h-0 lg:order-last">
              <div className="absolute inset-0 bg-gradient-to-bl from-primary/20 to-primary/5 rounded-2xl transform -rotate-3"></div>
              <img
                src="/assets/healthsharing3.jpg"
                alt="Healthcare sharing features and benefits"
                className="relative rounded-2xl shadow-2xl w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <SocialProof />
    </>
  );
};

export { BusinessesOrganizations };
export default BusinessesOrganizations;
