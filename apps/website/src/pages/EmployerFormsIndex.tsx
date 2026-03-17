import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Clock,
  Share2,
  ArrowRight,
  Briefcase,
  FileText,
  RefreshCw,
  Edit,
  UserMinus,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/button';
import { getEmployerForms } from '../config/forms.config';

export default function EmployerFormsIndex() {
  const employerForms = getEmployerForms();

  return (
    <>
      <Helmet>
        <title>Employer Forms | MPB Health</title>
        <meta name="description" content="Access all employer forms for managing your organization's health sharing plan with MPB Health." />
        <link rel="canonical" href="https://mpb.health/employer-forms/" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <section className="relative bg-gradient-to-br from-[#0a4c8f] to-[#1e5a9e] pt-16 pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00ek0xNiAzNmMtMi4yMSAwLTQgMS43OS00IDRzMS43OSA0IDQgNCA0LTEuNzkgNC00LTEuNzktNC00LTR6bTI4IDBjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00em0tMTItMTJjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>

          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/20">
                <Briefcase className="w-10 h-10 text-white" />
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Employer Forms
              </h1>

              <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                Manage your organization's health sharing plan with our streamlined employer forms
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid md:grid-cols-2 gap-6">
              {employerForms.map((form) => {
                const employerIconMap: Record<string, LucideIcon> = { Briefcase, FileText, RefreshCw, Edit, UserMinus };
                const Icon = employerIconMap[form.icon] || FileText;

                return (
                  <Card key={form.slug} className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
                          <Icon className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-neutral-900 mb-2">
                          {form.label}
                        </h3>
                        <p className="text-neutral-600 mb-3">
                          {form.description}
                        </p>
                        {form.estimatedMinutes && (
                          <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <Clock className="w-4 h-4" />
                            <span>Takes approximately {form.estimatedMinutes} minutes</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <Link to={form.slug} className="flex-1">
                        <Button variant="default" className="w-full">
                          <span>Open Form</span>
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      <Link to={form.slug}>
                        <Button variant="outline" size="md">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <Card className="inline-block p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Need Help?</h3>
                <p className="text-neutral-600 mb-4">
                  Our support team is here to assist you with any questions about employer forms.
                </p>
                <Link to="/contact">
                  <Button variant="outline">Contact Support</Button>
                </Link>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
