import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Phone, Shield } from 'lucide-react';
import { MarketingHydrationSeo } from '../../components/MarketingHydrationSeo';
import { EnrollmentEmbed } from '../../components/enrollment/EnrollmentEmbed';
import { getPlanEnrollmentConfig } from '../../lib/planEnrollmentConfig';
import { Button } from '../../components/ui/button';

export default function PlanEnrollmentPage() {
  const { planSlug = '' } = useParams<{ planSlug: string }>();
  const plan = getPlanEnrollmentConfig(planSlug);

  if (!plan) {
    return <Navigate to="/plans" replace />;
  }

  return (
    <>
      <MarketingHydrationSeo />

      <div className="min-h-screen bg-white">
        <section className="relative bg-gradient-to-br from-[#e8f3fc] via-[#d4e7f7] to-[#c4ddf2] py-10 md:py-14 overflow-hidden">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <Link to="/plans">
                <Button variant="ghost" size="sm" className="text-[#0a4c8f] hover:text-[#083d73]">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Plans
                </Button>
              </Link>
            </div>

            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0a4c8f]/10 rounded-2xl mb-5 border border-[#0a4c8f]/20">
                <Shield className="w-8 h-8 text-[#0a4c8f]" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0a4c8f] mb-4">
                {plan.title}
              </h1>
              <p className="text-lg text-[#0a4c8f]/80 mb-6">{plan.description}</p>
              <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-[#0a4c8f]/90">
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  ~{plan.estimatedMinutes} minutes
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {plan.audience}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Secure enrollment on mpb.health
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <EnrollmentEmbed embedUrl={plan.embedUrl} title={plan.label} />

            <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center">
              <p className="text-neutral-700 mb-4">
                Questions before you enroll? Our team is happy to walk you through your options.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="tel:8558164650"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0a4c8f] text-white font-semibold rounded-lg hover:bg-[#083d73] transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call (855) 816-4650
                </a>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-neutral-300 text-neutral-800 font-semibold rounded-lg hover:bg-white transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
