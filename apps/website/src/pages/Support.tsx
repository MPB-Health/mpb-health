import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  Clock,
  UserPlus,
  CreditCard,
  FileText,
  BarChart,
  MessageSquare,
  Upload,
  User,
  Video,
  Search,
  Users,
  Presentation,
  Building,
  DollarSign,
  GraduationCap,
  Headphones,
  ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/button';

interface SupportCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  external?: boolean;
}

const SupportCard: React.FC<SupportCardProps> = ({ icon, title, description, href, external }) => {
  const cardContent = (
    <div className="group relative bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300">
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-auto pt-4">
        <span className="inline-flex items-center text-sm font-medium text-primary group-hover:text-primary/80 transition-colors">
          Get Started
          {external && <ExternalLink className="ml-1 h-3 w-3" />}
          <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
        </span>
      </div>
    </div>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full">
        {cardContent}
      </a>
    );
  }

  return (
    <Link to={href} className="block h-full">
      {cardContent}
    </Link>
  );
};

const Support: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Member Support & Help Center | MPB Health</title>
        <meta
          name="description"
          content="Get help with your MPB Health membership. Access resources for employers, members, and advisors. Submit requests, find answers, and connect with our support team."
        />
        <meta name="keywords" content="MPB Health support, healthcare help, member support, employer portal, advisor resources" />
        <link rel="canonical" href="https://mpb.health/support" />
        <meta property="og:title" content="Support | MPB Health" />
        <meta property="og:description" content="Get help with your health sharing membership." />
        <meta property="og:url" content="https://mpb.health/support" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <section className="relative pt-16 pb-12 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center animate-fade-in">
              <h1 className="text-display-lg sm:text-display-xl font-bold text-neutral-900 mb-6">
                <span className="bg-gradient-to-r from-neutral-900 via-primary to-neutral-800 bg-clip-text text-transparent">
                  How Can We
                </span>{" "}
                <span className="bg-gradient-to-r from-cyan-600 via-[#a3cc43] to-blue-600 bg-clip-text text-transparent">
                  Help?
                </span>
              </h1>
              <p className="text-xl text-neutral-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                Get task-based support tailored to your role. Contact us directly or explore our knowledge base.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/contact">
                  <Button size="lg" variant="primary">
                    Contact Support
                  </Button>
                </Link>
                <Link to="/faq">
                  <Button size="lg" variant="outline">
                    Browse FAQ
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 bg-gradient-to-r from-primary to-accent rounded-full" />
                <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">
                  Employers & Plan Administrators
                </h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SupportCard
                  icon={<UserPlus className="h-6 w-6 text-primary" />}
                  title="Add or Remove Employees"
                  description="Manage eligibility changes and terminations"
                  href="/employee-removal"
                />
                <SupportCard
                  icon={<CreditCard className="h-6 w-6 text-primary" />}
                  title="Update Billing Information"
                  description="Change payment method or list-bill details"
                  href="/list-bill-update"
                />
                <SupportCard
                  icon={<FileText className="h-6 w-6 text-primary" />}
                  title="Access Compliance Forms"
                  description="Download required notices and regulatory documents"
                  href="/state-notices"
                />
                <SupportCard
                  icon={<BarChart className="h-6 w-6 text-primary" />}
                  title="View Group Reports"
                  description="Login to employer portal for analytics and summaries"
                  href="https://app.mpb.health/"
                  external
                />
                <SupportCard
                  icon={<MessageSquare className="h-6 w-6 text-primary" />}
                  title="Request Support"
                  description="Contact our employer support team"
                  href="/contact"
                />
              </div>
            </div>

            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 bg-gradient-to-r from-accent to-cyan-600 rounded-full" />
                <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">
                  Members & Families
                </h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SupportCard
                  icon={<Upload className="h-6 w-6 text-accent" />}
                  title="Submit a Medical Need"
                  description="Upload bills and documentation for sharing"
                  href="https://app.mpb.health/"
                  external
                />
                <SupportCard
                  icon={<User className="h-6 w-6 text-accent" />}
                  title="Update Personal Information"
                  description="Change address, add dependents, or update payment"
                  href="https://app.mpb.health/"
                  external
                />
                <SupportCard
                  icon={<Video className="h-6 w-6 text-accent" />}
                  title="Access Telehealth"
                  description="Schedule a virtual visit with a licensed provider"
                  href="https://mpb.health/telehealth"
                  external
                />
                <SupportCard
                  icon={<Search className="h-6 w-6 text-accent" />}
                  title="Find a Provider"
                  description="Search the nationwide PPO network"
                  href="https://mpb.health/find-provider"
                  external
                />
                <SupportCard
                  icon={<Users className="h-6 w-6 text-accent" />}
                  title="Contact Your Advisor"
                  description="Schedule a call or send a message"
                  href="/review-or-change-advisor"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full" />
                <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">
                  Advisors & Brokers
                </h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SupportCard
                  icon={<Presentation className="h-6 w-6 text-cyan-600" />}
                  title="Access Marketing Materials"
                  description="Download pitch decks, one-pagers, and co-branded assets"
                  href="/resources?audience=Advisors&type=Marketing"
                />
                <SupportCard
                  icon={<Building className="h-6 w-6 text-cyan-600" />}
                  title="Submit New Group"
                  description="Initiate enrollment for a new employer client"
                  href="/contact"
                />
                <SupportCard
                  icon={<DollarSign className="h-6 w-6 text-cyan-600" />}
                  title="Request Commission Statement"
                  description="View or download commission reports"
                  href="/contact"
                />
                <SupportCard
                  icon={<GraduationCap className="h-6 w-6 text-cyan-600" />}
                  title="Get Product Training"
                  description="Access recorded webinars and certification courses"
                  href="/resources?audience=Advisors&type=Webinar"
                />
                <SupportCard
                  icon={<Headphones className="h-6 w-6 text-cyan-600" />}
                  title="Partner Support"
                  description="Contact your dedicated partnership manager"
                  href="/contact"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-br from-blue-600 via-cyan-600 to-[#a3cc43]">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-4">
                Still Need Help?
              </h2>
              <p className="text-lg text-white/90">
                Our team is here to assist you.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="inline-flex w-12 h-12 rounded-lg bg-white/20 items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">Phone</h3>
                <a
                  href="tel:8558164650"
                  className="text-white hover:text-white/90 transition-colors font-medium"
                >
                  (855) 816-4650
                </a>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="inline-flex w-12 h-12 rounded-lg bg-white/20 items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">Email</h3>
                <a
                  href="mailto:info@mympb.com"
                  className="text-white hover:text-white/90 transition-colors font-medium break-all"
                >
                  info@mympb.com
                </a>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="inline-flex w-12 h-12 rounded-lg bg-white/20 items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">Hours</h3>
                <p className="text-white/90 text-sm">
                  Monday-Friday<br />8 AM - 6 PM EST
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link to="/contact">
                <Button size="lg" variant="primary" className="bg-white text-primary hover:bg-white/90 shadow-xl">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export { Support };
export default Support;
