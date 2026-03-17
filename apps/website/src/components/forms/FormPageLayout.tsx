import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Clock,
  CheckCircle2,
  Shield,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  X,
  FileText,
  Briefcase,
  RefreshCw,
  Edit,
  Edit3,
  UserMinus,
  Users,
  XCircle,
  MessageSquare,
  UserPlus,
  Pill,
  Calendar,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';
import { FormEmbed } from './FormEmbed';
import { ShareBar } from './ShareBar';
import { useAuth } from '../../contexts/AuthContext';

interface FormPageLayoutProps {
  title: string;
  description: string;
  icon: string;
  estimatedMinutes?: number;
  cognitoEmbed?: string;
  slug: string;
}

export function FormPageLayout({
  title,
  description,
  icon,
  estimatedMinutes,
  cognitoEmbed,
  slug,
}: FormPageLayoutProps) {
  const { user } = useAuth();
  const [tipsOpen, setTipsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const formIconMap: Record<string, LucideIcon> = {
    FileText, Briefcase, RefreshCw, Edit, Edit3, UserMinus, Users,
    Shield, XCircle, MessageSquare, UserPlus, Pill, Calendar, CreditCard,
  };
  const Icon = formIconMap[icon] || FileText;

  const userEmail = user?.email;

  return (
    <>
      <Helmet>
        <title>{title} | MPB Health</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://mpb.health${slug}`} />
      </Helmet>

      <div className="min-h-screen bg-white">
        <section className="relative bg-gradient-to-br from-[#e8f3fc] via-[#d4e7f7] to-[#c4ddf2] pt-8 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00ek0xNiAzNmMtMi4yMSAwLTQgMS43OS00IDRzMS43OSA0IDQgNCA0LTEuNzkgNC00LTEuNzktNC00LTR6bTI4IDBjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00em0tMTItMTJjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-[#0a4c8f]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-[#0a4c8f]/15 rounded-full blur-3xl"></div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0a4c8f]/10 backdrop-blur-sm rounded-2xl mb-6 border border-[#0a4c8f]/20">
                <Icon className="w-10 h-10 text-[#0a4c8f]" />
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0a4c8f] mb-6 leading-tight">
                {title}
              </h1>

              <p className="text-xl sm:text-2xl text-[#0a4c8f]/80 max-w-3xl mx-auto leading-relaxed">
                {description}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-[#0a4c8f]/90">
                {estimatedMinutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#0a4c8f]" />
                    <span className="text-sm font-medium">Takes ~{estimatedMinutes} minutes</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#0a4c8f]" />
                  <span className="text-sm font-medium">Quick & Easy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#0a4c8f]" />
                  <span className="text-sm font-medium">Secure Process</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Mobile: Collapsible Tips Accordion */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setTipsOpen(!tipsOpen)}
                className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200 text-[#0a4c8f] font-semibold"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  <span>Tips & Share Options</span>
                </div>
                {tipsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {tipsOpen && (
                <div className="mt-3 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <ShareBar
                    url={slug}
                    title={title}
                    emailTo={userEmail}
                    emailSubject={`MPB Health Form: ${title}`}
                    emailBody={`I wanted to share this form with you:\n\n${title}\n${description}\n\nhttps://mpb.health${slug}\n\nBest regards`}
                  />
                  <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-5 h-5 text-[#0a4c8f]" />
                      <p className="text-sm font-semibold uppercase tracking-wide text-[#0a4c8f]">
                        Helpful tips
                      </p>
                    </div>
                    <ul className="space-y-2 text-sm text-neutral-700">
                      <li>• Gather your membership details before starting.</li>
                      <li>• The form saves automatically between fields.</li>
                      <li>• Need help? Call <a className="text-[#0a4c8f] underline" href="tel:18776593423">877-659-3423</a>.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop: Full-width form with floating sidebar toggle */}
            <div className="relative">
              {/* Toggle Button - Desktop */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex fixed right-6 top-1/3 z-40 items-center gap-2 px-4 py-3 bg-[#0a4c8f] text-white rounded-l-xl shadow-lg hover:bg-[#083d73] transition-all duration-300"
                aria-label="Toggle tips panel"
              >
                <HelpCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Tips</span>
              </button>

              {/* Slide-out Sidebar - Desktop */}
              <div
                className={`hidden lg:block fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
                  sidebarOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
              >
                <div className="p-6 h-full overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-[#0a4c8f]">Tips & Share</h3>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-neutral-600" />
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <ShareBar
                      url={slug}
                      title={title}
                      emailTo={userEmail}
                      emailSubject={`MPB Health Form: ${title}`}
                      emailBody={`I wanted to share this form with you:\n\n${title}\n${description}\n\nhttps://mpb.health${slug}\n\nBest regards`}
                    />

                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-5 h-5 text-[#0a4c8f]" />
                        <p className="text-sm font-semibold uppercase tracking-wide text-[#0a4c8f]">
                          Helpful tips
                        </p>
                      </div>
                      <ul className="space-y-3 text-sm text-neutral-700">
                        <li>• Gather your membership details before starting the form.</li>
                        <li>• The request saves automatically when you move between fields.</li>
                        <li>• Need help? Reach Member Services at <a className="text-[#0a4c8f] underline" href="tel:18776593423">877-659-3423</a>.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overlay when sidebar is open */}
              {sidebarOpen && (
                <div
                  className="hidden lg:block fixed inset-0 bg-black/20 z-40"
                  onClick={() => setSidebarOpen(false)}
                />
              )}

              {/* Full-width Form */}
              <div className="w-full">
                <FormEmbed cognitoEmbed={cognitoEmbed} formTitle={title} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
