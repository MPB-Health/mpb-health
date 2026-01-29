import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import {
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  FileText,
  CheckCircle2,
  PlayCircle,
  BarChart3,
  Target,
  Sparkles,
  Newspaper,
  ExternalLink,
  Search,
  Video,
  TicketPlus,
  Zap,
  ArrowRight,
  Bell,
  HelpCircle,
  Phone,
  MessageSquare,
  ChevronRight,
  Briefcase,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  advisorAuthService,
  AdvisorProfile,
  TrainingModule,
  Certification,
} from '../../lib/advisorAuthService';
import { advisorContentService, AdvisorContent } from '../../lib/advisorContentService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/Badge';
import { AdvisorTerminal } from '../../components/terminal/AdvisorTerminal';
import { AdvisorToolkit } from '../../components/advisor/AdvisorToolkit';
import { LiveMeetingBanner } from '../../components/advisor/LiveMeetingBanner';

// Helper to dynamically render Lucide icons by name
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Link;
  return <IconComponent className={className} />;
};

export default function AdvisorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AdvisorProfile | null>(null);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [latestBulletins, setLatestBulletins] = useState<AdvisorContent[]>([]);
  const [stats, setStats] = useState({
    totalModules: 0,
    completedModules: 0,
    inProgressModules: 0,
    totalTimeSpent: 0,
    avgQuizScore: 0,
    certifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowTerminal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const loadDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[AdvisorDashboard] Loading data for user:', user.id);

      const [profileData, modulesData, certsData, statsData, bulletinsData] = await Promise.all([
        advisorAuthService.getAdvisorProfile(user.id),
        advisorAuthService.getTrainingModules(),
        advisorAuthService.getCertifications(user.id),
        advisorAuthService.getTrainingStats(user.id),
        advisorContentService.getLatestBulletins(3),
      ]);

      console.log('[AdvisorDashboard] Profile data:', profileData);
      console.log('[AdvisorDashboard] Modules:', modulesData.length);
      console.log('[AdvisorDashboard] Stats:', statsData);

      setProfile(profileData);
      setModules(modulesData.slice(0, 6));
      setCertifications(certsData);
      setStats(statsData);
      setLatestBulletins(bulletinsData);
    } catch (error) {
      console.error('[AdvisorDashboard] Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Advisor Profile Not Found</h2>
          <p className="text-gray-600 mb-6">
            You don't have an advisor profile yet. Complete the onboarding process to get started.
          </p>
          <Button asChild>
            <Link to="/advisor/onboarding">Start Onboarding</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const completionRate = stats.totalModules > 0
    ? Math.round((stats.completedModules / stats.totalModules) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile.first_name}!
          </h1>
          <p className="text-gray-600">
            Track your training progress and access resources
          </p>
        </div>

        {/* Live Meeting Banner */}
        <LiveMeetingBanner className="mb-6" />

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Bulletins Quick Action */}
            <Link
              to="/advisor/bulletins"
              className="group relative overflow-hidden p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="p-2 bg-white/20 rounded-lg w-fit mb-3">
                  <Newspaper className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1">Bulletins</h3>
                <p className="text-xs text-blue-100">View latest updates</p>
                {latestBulletins.length > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <Bell className="w-3 h-3 text-yellow-300" />
                    <span className="text-xs text-yellow-100">{latestBulletins.length} new</span>
                  </div>
                )}
              </div>
              <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>

            {/* Support Ticket Quick Action */}
            <a
              href="https://support.mpb.health/login/advisor"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="p-2 bg-white/20 rounded-lg w-fit mb-3">
                  <TicketPlus className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1">Submit Ticket</h3>
                <p className="text-xs text-purple-100">Get support help</p>
              </div>
              <ExternalLink className="absolute bottom-4 right-4 w-4 h-4 opacity-50 group-hover:opacity-100 transition-all" />
            </a>

            {/* Training Quick Action */}
            <Link
              to="/advisor/training"
              className="group relative overflow-hidden p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="p-2 bg-white/20 rounded-lg w-fit mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1">Training</h3>
                <p className="text-xs text-green-100">Continue learning</p>
                {stats.inProgressModules > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <PlayCircle className="w-3 h-3" />
                    <span className="text-xs">{stats.inProgressModules} in progress</span>
                  </div>
                )}
              </div>
              <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>

            {/* Advisor Toolkit Quick Action */}
            <Link
              to="/advisor/toolkit"
              className="group relative overflow-hidden p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="p-2 bg-white/20 rounded-lg w-fit mb-3">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1">Advisor Toolkit</h3>
                <p className="text-xs text-orange-100">Forms & resources</p>
              </div>
              <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>

            {/* Resources Quick Action */}
            <Link
              to="/advisor/resources"
              className="group relative overflow-hidden p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl text-white hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="p-2 bg-white/20 rounded-lg w-fit mb-3">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1">Resources</h3>
                <p className="text-xs text-indigo-100">Plan documents & handbooks</p>
              </div>
              <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Advisor Meetings Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-600" />
                  Advisor Meetings
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/advisor/meetings">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Join us every 2nd and 4th Tuesday of the month.
              </p>
              <Link
                to="/advisor/meetings"
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Video className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Advisor Town Hall</span>
                    <p className="text-xs text-gray-500">Bi-weekly meetings with playbook access</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </Link>
            </Card>

            {stats.inProgressModules > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-blue-600" />
                    Continue Learning
                  </h2>
                  <Link to="/advisor/training">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
                <p className="text-gray-600 mb-4">
                  You have {stats.inProgressModules} module{stats.inProgressModules !== 1 ? 's' : ''} in progress
                </p>
                <div className="flex gap-3">
                  <Button variant="primary" className="flex-1" asChild>
                    <Link to="/advisor/training">Resume Training</Link>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <Link to="/advisor/university">View All Paths</Link>
                  </Button>
                </div>
              </Card>
            )}

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Training Modules</h2>
                <Link to="/advisor/training">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
              <div className="space-y-2">
                {modules.slice(0, 6).map(module => (
                  <Link
                    key={module.id}
                    to={`/advisor/training/module/${module.id}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-gray-900 text-sm truncate flex-1">{module.title}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500">{module.duration_minutes}m</span>
                      {module.is_required && (
                        <Badge variant="default" className="text-xs py-0">Required</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {latestBulletins.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-blue-600" />
                    Latest Bulletins
                  </h2>
                  <div className="flex items-center gap-1">
                    <Link to="/advisor/bulletins">
                      <Button variant="ghost" size="sm" className="p-2" title="Search Bulletins">
                        <Search className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to="/advisor/bulletins">
                      <Button variant="ghost" size="sm">View All</Button>
                    </Link>
                  </div>
                </div>
                <div className="space-y-3">
                  {latestBulletins.map(bulletin => (
                    <Link
                      key={bulletin.id}
                      to={`/advisor/content/${bulletin.slug}`}
                      className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors group"
                    >
                      {bulletin.featured_image_url && (
                        <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                          <img
                            src={bulletin.featured_image_url}
                            alt={bulletin.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                          {bulletin.title}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {new Date(bulletin.published_date).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {certifications.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Your Certifications
                </h2>
                <div className="space-y-3">
                  {certifications.map(cert => (
                    <div
                      key={cert.id}
                      className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                    >
                      <div className="flex items-start gap-3">
                        <Award className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm">
                            {cert.certification_type}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">
                            Earned {new Date(cert.earned_at).toLocaleDateString()}
                          </p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <AdvisorToolkit />

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Contact your training coordinator or visit the support center.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                asChild
              >
                <a
                  href="https://support.mpb.health/login/advisor"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get Support
                </a>
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {showTerminal && (
        <AdvisorTerminal
          onClose={() => setShowTerminal(false)}
          defaultMinimized={false}
        />
      )}
    </div>
  );
}
