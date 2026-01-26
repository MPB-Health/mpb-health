import { useEffect, useState } from 'react';
import {
  User,
  Award,
  BookOpen,
  Clock,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Target,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  advisorAuthService,
  AdvisorProfile as IAdvisorProfile,
  Certification,
} from '../../lib/advisorAuthService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export default function AdvisorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<IAdvisorProfile | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [stats, setStats] = useState({
    totalModules: 0,
    completedModules: 0,
    inProgressModules: 0,
    totalTimeSpent: 0,
    avgQuizScore: 0,
    certifications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [profileData, certsData, statsData] = await Promise.all([
        advisorAuthService.getAdvisorProfile(user.id),
        advisorAuthService.getCertifications(user.id),
        advisorAuthService.getTrainingStats(user.id),
      ]);

      setProfile(profileData);
      setCertifications(certsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load your advisor profile.</p>
        </Card>
      </div>
    );
  }

  const completionRate = stats.totalModules > 0
    ? Math.round((stats.completedModules / stats.totalModules) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {profile.first_name} {profile.last_name}
                </h2>
                <Badge variant="outline" className="capitalize">
                  {profile.specialization}
                </Badge>
                <div className="mt-4">
                  <Badge
                    variant={profile.status === 'active' ? 'default' : 'outline'}
                    className={
                      profile.status === 'active'
                        ? 'bg-green-600'
                        : profile.status === 'pending'
                        ? 'bg-yellow-600'
                        : 'bg-gray-600'
                    }
                  >
                    {profile.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {profile.onboarding_completed && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Onboarding Complete</span>
                  </div>
                  {profile.onboarding_completed_at && (
                    <p className="text-xs text-gray-600 mt-1 ml-7">
                      Completed {new Date(profile.onboarding_completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </Card>

            {certifications.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Certifications
                </h3>
                <div className="space-y-3">
                  {certifications.map(cert => (
                    <div
                      key={cert.id}
                      className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                    >
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {cert.certification_type}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            Earned {new Date(cert.earned_at).toLocaleDateString()}
                          </p>
                          {cert.expires_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              Expires {new Date(cert.expires_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Training Progress
              </h3>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {completionRate}%
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Total Time</span>
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {stats.totalTimeSpent}h
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Learning invested</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Target className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalModules}
                  </div>
                  <div className="text-xs text-gray-600">Total Modules</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {stats.completedModules}
                  </div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.inProgressModules}
                  </div>
                  <div className="text-xs text-gray-600">In Progress</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Performance Metrics
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Average Quiz Score</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {stats.avgQuizScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stats.avgQuizScore >= 80
                          ? 'bg-green-600'
                          : stats.avgQuizScore >= 60
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${stats.avgQuizScore}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Certifications</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.certifications}
                    </div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Achievements</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.certifications + Math.floor(stats.completedModules / 5)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">Keep Learning!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Continue your training journey to unlock more certifications and improve your
                skills.
              </p>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  View Training
                </button>
                <button className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium border border-blue-200">
                  Browse SOPs
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
