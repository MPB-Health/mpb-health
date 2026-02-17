import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  BarChart3, TrendingUp, Users, DollarSign,
  Shield, Lock, Zap, Eye, PieChart, LineChart, Phone, ArrowRight, CheckCircle2
} from 'lucide-react';
import { Card } from '../components/ui/Card';

const InsightsAnalytics: React.FC = () => {
  const dashboardFeatures = [
    {
      icon: BarChart3,
      title: 'Real-Time Reporting',
      description: 'Access up-to-the-minute data on member enrollment, utilization, and sharing activity across your organization.'
    },
    {
      icon: TrendingUp,
      title: 'Cost Trend Analysis',
      description: 'Track healthcare spending patterns over time and identify opportunities for cost optimization and savings.'
    },
    {
      icon: Users,
      title: 'Member Utilization Metrics',
      description: 'Monitor which services members are using most frequently and identify gaps in care engagement.'
    },
    {
      icon: DollarSign,
      title: 'Savings Calculator',
      description: 'Compare your health sharing costs against traditional insurance premiums to quantify your savings.'
    },
    {
      icon: PieChart,
      title: 'Demographic Insights',
      description: 'Understand your member population by age, location, plan type, and household composition.'
    },
    {
      icon: LineChart,
      title: 'Claims Tracking',
      description: 'Follow the lifecycle of medical needs from submission through sharing, with detailed status updates.'
    }
  ];

  const reportingCapabilities = [
    {
      title: 'Custom Report Builder',
      description: 'Create tailored reports that focus on the metrics that matter most to your organization.'
    },
    {
      title: 'Scheduled Reports',
      description: 'Automate report generation and delivery to stakeholders on daily, weekly, or monthly schedules.'
    },
    {
      title: 'Multi-Format Export',
      description: 'Download reports in CSV, Excel, PDF, or JSON formats for further analysis or sharing.'
    },
    {
      title: 'Drill-Down Analysis',
      description: 'Click into summary data to access detailed breakdowns and individual transaction records.'
    },
    {
      title: 'Comparative Analytics',
      description: 'Compare performance across time periods, departments, or locations within your organization.'
    },
    {
      title: 'Benchmarking Data',
      description: 'See how your organization compares to industry averages and similar-sized groups.'
    }
  ];

  const keyMetrics = [
    {
      metric: 'Total Enrolled Members',
      description: 'Active member count with enrollment trends',
      icon: Users
    },
    {
      metric: 'Monthly Contributions',
      description: 'Total member contributions and payment status',
      icon: DollarSign
    },
    {
      metric: 'Sharing Activity',
      description: 'Medical needs submitted and shared amounts',
      icon: TrendingUp
    },
    {
      metric: 'Cost Savings',
      description: 'Cumulative savings vs traditional insurance',
      icon: PieChart
    }
  ];

  const securityFeatures = [
    {
      icon: Lock,
      title: 'HIPAA Compliance',
      description: 'All data is encrypted and stored in HIPAA-compliant systems with strict access controls.'
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Control who can view, edit, or export data with granular permission settings.'
    },
    {
      icon: Eye,
      title: 'Audit Logging',
      description: 'Track all user actions and data access with comprehensive audit trails for compliance.'
    },
    {
      icon: Zap,
      title: 'Real-Time Monitoring',
      description: 'Continuous security monitoring detects and prevents unauthorized access attempts.'
    }
  ];

  const useCases = [
    {
      title: 'For HR Directors',
      points: [
        'Monitor employee participation rates',
        'Track benefits utilization patterns',
        'Generate compliance reports',
        'Analyze cost per membership trends'
      ]
    },
    {
      title: 'For CFOs',
      points: [
        'Calculate ROI on health sharing programs',
        'Forecast future healthcare expenses',
        'Compare costs across departments',
        'Export financial data for accounting'
      ]
    },
    {
      title: 'For Benefits Administrators',
      points: [
        'Manage member enrollments and changes',
        'Process new member onboarding',
        'Handle billing and payment tracking',
        'Support member questions with data access'
      ]
    }
  ];

  const testimonials = [
    {
      name: 'Patricia Williams',
      role: 'HR Director, Tech Startup',
      content: 'The analytics dashboard has transformed how we manage our health benefits. Being able to see real-time data on utilization and costs helps us make informed decisions about our program.'
    },
    {
      name: 'James Anderson',
      role: 'CFO, Manufacturing Company',
      content: 'The cost comparison reports have been invaluable. We can clearly show our board the significant savings we are achieving versus traditional insurance options.'
    },
    {
      name: 'Maria Garcia',
      role: 'Benefits Administrator',
      content: 'I love how easy it is to pull reports and export data. Whether I need enrollment numbers or claims summaries, everything is just a few clicks away.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Insights & Analytics - MPB Health</title>
        <meta
          name="description"
          content="Real-time reporting and dashboards for employers and group administrators. Make data-driven decisions with powerful analytics from MPB Health."
        />
      </Helmet>

      <section
        className="relative pt-20 pb-16 overflow-hidden"
        style={{
          backgroundImage: "url('/assets/businessTeamWorking.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-emerald-600/20" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <div className="inline-flex w-20 h-20 rounded-2xl bg-emerald-600/10 items-center justify-center mb-6 backdrop-blur-sm">
              <BarChart3 className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-display-lg sm:text-display-xl font-bold text-neutral-900 mb-6 text-balance">
              <span className="bg-gradient-to-r from-neutral-900 via-emerald-600 to-neutral-800 bg-clip-text text-transparent">
                Powerful Analytics
              </span>{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
                for Better Decisions
              </span>
            </h1>
            <p className="text-xl text-neutral-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Gain complete visibility into your health sharing program with intuitive dashboards and real-time reporting.
              Make data-driven decisions that benefit your team and your bottom line.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://outlook.office.com/book/SpeakWithaAdvisor@NETORG6712533.onmicrosoft.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Request Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <a
                href="tel:8558164650"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-emerald-600 border-2 border-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-colors"
              >
                <Phone className="w-5 h-5" />
                (855) 816-4650
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Dashboard Features
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Comprehensive analytics tools designed specifically for employers and group administrators
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="inline-flex w-14 h-14 rounded-xl bg-emerald-600/10 items-center justify-center mb-4">
                    <Icon className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Key Metrics at Your Fingertips
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Monitor the most important indicators of your health sharing program performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {keyMetrics.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">
                    {item.metric}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {item.description}
                  </p>
                </Card>
              );
            })}
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                  Advanced Reporting Capabilities
                </h3>
                <ul className="space-y-3">
                  {reportingCapabilities.slice(0, 3).map((capability, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-neutral-900">{capability.title}:</strong>{' '}
                        <span className="text-neutral-700">{capability.description}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <ul className="space-y-3">
                  {reportingCapabilities.slice(3).map((capability, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-neutral-900">{capability.title}:</strong>{' '}
                        <span className="text-neutral-700">{capability.description}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Your data is protected with the highest standards of security and compliance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="inline-flex w-14 h-14 rounded-xl bg-emerald-600/10 items-center justify-center mb-4">
                    <Icon className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Tailored for Your Role
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Analytics and insights designed for different stakeholders in your organization
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="p-8 hover:shadow-lg transition-shadow">
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">
                  {useCase.title}
                </h3>
                <ul className="space-y-3">
                  {useCase.points.map((point, pIndex) => (
                    <li key={pIndex} className="flex items-start gap-2 text-neutral-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              What Administrators Say
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Hear from the people who use our analytics platform every day
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-600/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900">{testimonial.name}</h4>
                    <p className="text-sm text-neutral-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-neutral-600 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-emerald-600 to-teal-600">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to See Your Data in Action?
          </h2>
          <p className="text-xl text-emerald-50 mb-8">
            Schedule a personalized demo to explore how our analytics platform can transform your benefits management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://outlook.office.com/book/SpeakWithaAdvisor@NETORG6712533.onmicrosoft.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Request a Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
            <Link
              to="/businesses-and-organizations"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Learn About Group Plans
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export { InsightsAnalytics };
export default InsightsAnalytics;
