import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  GraduationCap,
  BookOpen,
  Award,
  Target,
  TrendingUp,
  Flame,
  Trophy,
  Star,
  Clock,
  ExternalLink,
  Play,
  CheckCircle,
  Lock,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  Video,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { advisorAuthService, TrainingModule, TrainingProgress, AdvisorProfile } from '../../lib/advisorAuthService';
import { advisorCMSService, AdvisorLearningPath } from '../../lib/advisorCMSService';
import {
  externalLMSService,
  CourseWithProgress,
  LessonWithProgress,
  TrainingStats,
} from '../../lib/externalLMSService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LearningPathCard, LearningPath } from '../../components/advisor/LearningPathCard';
import { cn } from '../../lib/utils';

export default function TrainingUniversity() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<AdvisorProfile | null>(null);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [progress, setProgress] = useState<Map<string, TrainingProgress>>(new Map());
  const [cmsLearningPaths, setCmsLearningPaths] = useState<AdvisorLearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  // External LMS state
  const [externalCourses, setExternalCourses] = useState<CourseWithProgress[]>([]);
  const [externalStats, setExternalStats] = useState<TrainingStats | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithProgress | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LessonWithProgress | null>(null);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'mpb-training' | 'internal'>('mpb-training');

  const [stats, setStats] = useState({
    currentStreak: 0,
    totalPoints: 0,
    rank: 'Beginner',
    nextRank: 'Intermediate',
    pointsToNextRank: 500,
  });

  useEffect(() => {
    loadTrainingData();
  }, [user]);

  // Check for course/lesson from URL params
  useEffect(() => {
    const courseId = searchParams.get('course');
    const lessonId = searchParams.get('lesson');

    if (courseId && externalCourses.length > 0) {
      const course = externalCourses.find(c => c.id === courseId);
      if (course) {
        setSelectedCourse(course);
        if (lessonId) {
          const lesson = course.lessonsWithProgress.find(l => l.id === lessonId);
          if (lesson) {
            setSelectedLesson(lesson);
            setShowEmbedModal(true);
          }
        }
      }
    }
  }, [searchParams, externalCourses]);

  const loadTrainingData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load internal training data
      const [profileData, modulesData, progressData, pathsData] = await Promise.all([
        advisorAuthService.getAdvisorProfile(user.id),
        advisorAuthService.getTrainingModules(),
        advisorAuthService.getTrainingProgress(user.id),
        advisorCMSService.getLearningPaths(),
      ]);

      setProfile(profileData);
      setModules(modulesData);
      setCmsLearningPaths(pathsData);

      const progressMap = new Map(progressData.map(p => [p.module_id, p]));
      setProgress(progressMap);

      const completedModules = progressData.filter(p => p.status === 'completed').length;
      setStats({
        currentStreak: Math.min(completedModules, 7),
        totalPoints: completedModules * 100,
        rank: completedModules < 5 ? 'Beginner' : completedModules < 15 ? 'Intermediate' : 'Expert',
        nextRank: completedModules < 5 ? 'Intermediate' : completedModules < 15 ? 'Expert' : 'Master',
        pointsToNextRank: completedModules < 5 ? 500 : completedModules < 15 ? 1500 : 3000,
      });

      // Load external LMS data
      if (profileData) {
        try {
          const [coursesData, statsData] = await Promise.all([
            externalLMSService.getCoursesWithProgress(profileData.id),
            externalLMSService.getAdvisorTrainingStats(profileData.id),
          ]);
          setExternalCourses(coursesData);
          setExternalStats(statsData);
        } catch (err) {
          console.error('Error loading external LMS data:', err);
        }
      }
    } catch (error) {
      console.error('Error loading training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollInCourse = async (courseId: string) => {
    if (!profile) return;

    try {
      await externalLMSService.enrollInCourse(profile.id, courseId);
      await loadTrainingData();
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

  const handleStartLesson = async (lesson: LessonWithProgress) => {
    if (!profile) return;

    try {
      await externalLMSService.startLesson(profile.id, lesson.id);
      setSelectedLesson(lesson);
      setShowEmbedModal(true);

      // Update URL
      if (selectedCourse) {
        setSearchParams({ course: selectedCourse.id, lesson: lesson.id });
      }
    } catch (error) {
      console.error('Error starting lesson:', error);
      // Still open the lesson even if tracking fails
      setSelectedLesson(lesson);
      setShowEmbedModal(true);
    }
  };

  const handleCompleteLesson = async () => {
    if (!profile || !selectedLesson) return;

    try {
      await externalLMSService.completeLesson(profile.id, selectedLesson.id);
      await loadTrainingData();
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const handleCloseEmbed = () => {
    setShowEmbedModal(false);
    setSelectedLesson(null);
    setIsFullscreen(false);
    setSearchParams({});
  };

  const openExternalTraining = () => {
    window.open('https://training.mpb.health', '_blank', 'noopener,noreferrer');
  };

  // Helper function to check if a path is locked based on unlock requirements
  const isPathLocked = (path: AdvisorLearningPath): boolean => {
    if (!path.unlock_requirements) return false;

    const req = path.unlock_requirements;
    let completedCount = 0;

    if (req.category) {
      completedCount = modules.filter(
        m => m.category === req.category && progress.get(m.id)?.status === 'completed'
      ).length;
    } else if (req.categories && req.categories.length > 0) {
      completedCount = modules.filter(
        m => req.categories!.includes(m.category) && progress.get(m.id)?.status === 'completed'
      ).length;
    }

    return completedCount < (req.min_completed || 0);
  };

  // Build learning paths from CMS data with computed fields
  const learningPaths: LearningPath[] = cmsLearningPaths.map(path => ({
    id: path.id,
    title: path.title,
    description: path.description || '',
    category: path.category_slug || '',
    totalModules: modules.filter(m => m.category === path.category_slug).length,
    completedModules: modules.filter(
      m => m.category === path.category_slug && progress.get(m.id)?.status === 'completed'
    ).length,
    estimatedHours: path.estimated_hours,
    isRequired: path.is_required,
    isLocked: isPathLocked(path),
    icon: path.icon,
    gradient: path.gradient,
  }));

  const totalCompleted = Array.from(progress.values()).filter(p => p.status === 'completed').length;
  const totalModules = modules.length;
  const overallProgress = totalModules > 0 ? Math.round((totalCompleted / totalModules) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Training University...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Required</h2>
          <p className="text-gray-600 mb-6">
            Complete your advisor profile to access Training University.
          </p>
          <Button asChild>
            <Link to="/advisor/onboarding">Complete Profile</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Training University | MPB Health Advisor Portal</title>
        <meta
          name="description"
          content="Access comprehensive training modules and learning paths to become a certified MPB Health advisor."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Training University</h1>
                <p className="text-gray-600">
                  Welcome back, {profile.first_name}! Continue your learning journey.
                </p>
              </div>
            </div>
          </div>

          {/* MPB Training Platform Banner */}
          <Card className="mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 rounded-xl">
                    <GraduationCap className="w-10 h-10" />
                  </div>
                  <div>
                    <Badge className="bg-white/20 text-white border-0 mb-2">
                      Official Training Platform
                    </Badge>
                    <h2 className="text-2xl font-bold">MPB Healthcare Advisor Certification</h2>
                    <p className="text-green-100 mt-1">
                      Complete the required training to become a certified MPB Healthcare Advisor
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={openExternalTraining}
                    className="bg-white text-green-600 hover:bg-green-50"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Full Platform
                  </Button>
                </div>
              </div>

              {/* External Training Stats */}
              {externalStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-2xl font-bold">
                      {externalStats.completedCourses}/{externalStats.totalCourses}
                    </div>
                    <div className="text-green-100 text-sm">Courses Completed</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-2xl font-bold">
                      {externalStats.completedLessons}/{externalStats.totalLessons}
                    </div>
                    <div className="text-green-100 text-sm">Lessons Completed</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-2xl font-bold">{externalStats.overallProgress}%</div>
                    <div className="text-green-100 text-sm">Overall Progress</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-2xl font-bold">
                      {Math.round(externalStats.totalTimeSpent / 60)}h
                    </div>
                    <div className="text-green-100 text-sm">Time Invested</div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'mpb-training' ? 'default' : 'outline'}
              onClick={() => setActiveTab('mpb-training')}
              className={activeTab === 'mpb-training' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              MPB Training Courses
            </Button>
            <Button
              variant={activeTab === 'internal' ? 'default' : 'outline'}
              onClick={() => setActiveTab('internal')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Additional Resources
            </Button>
          </div>

          {/* MPB Training Courses Tab */}
          {activeTab === 'mpb-training' && (
            <div className="space-y-6">
              {/* External Courses Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {externalCourses.map(course => (
                  <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div
                      className={cn(
                        'h-3',
                        course.is_required ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      )}
                    />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <GraduationCap className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex gap-2">
                          {course.is_required && (
                            <Badge className="bg-red-100 text-red-700">Required</Badge>
                          )}
                          {course.enrollment?.status === 'completed' && (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>

                      <h3 className="font-bold text-lg text-gray-900 mb-2">{course.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {course.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {course.estimated_hours}h
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {course.lessonsWithProgress.length} lessons
                        </span>
                        <Badge variant="outline">{course.category}</Badge>
                      </div>

                      {course.enrollment ? (
                        <>
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium">
                                {course.enrollment.progress_percent}%
                              </span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-full rounded-full transition-all"
                                style={{ width: `${course.enrollment.progress_percent}%` }}
                              />
                            </div>
                          </div>

                          <Button
                            className="w-full"
                            onClick={() => setSelectedCourse(course)}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {course.enrollment.status === 'completed'
                              ? 'Review Course'
                              : 'Continue Learning'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => handleEnrollInCourse(course.id)}
                        >
                          <GraduationCap className="w-4 h-4 mr-2" />
                          Enroll Now
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Selected Course - Lesson List */}
              {selectedCourse && !showEmbedModal && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedCourse.title}</h3>
                      <p className="text-gray-600">
                        {selectedCourse.lessonsWithProgress.length} lessons •{' '}
                        {selectedCourse.enrollment?.lessons_completed || 0} completed
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedCourse.course_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in MPB Training
                      </Button>
                      <Button variant="ghost" onClick={() => setSelectedCourse(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {selectedCourse.lessonsWithProgress.map((lesson, index) => {
                      const isCompleted = lesson.completion?.status === 'completed';
                      const isInProgress = lesson.completion?.status === 'in_progress';
                      const isLocked = false; // Could add prerequisite logic here

                      return (
                        <div
                          key={lesson.id}
                          className={cn(
                            'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                            isCompleted
                              ? 'bg-green-50 border-green-200'
                              : isInProgress
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : isInProgress
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-600'
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : isLocked ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              index + 1
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 truncate">{lesson.title}</h4>
                              {lesson.has_video && (
                                <Video className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              )}
                              {lesson.is_required && (
                                <Badge className="bg-red-100 text-red-700 text-xs">Required</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lesson.duration_minutes} min
                              </span>
                              {lesson.completion?.time_spent_minutes && lesson.completion.time_spent_minutes > 0 && (
                                <span className="text-green-600">
                                  {lesson.completion.time_spent_minutes} min spent
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isCompleted ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStartLesson(lesson)}
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleStartLesson(lesson)}
                                disabled={isLocked}
                                className={isInProgress ? 'bg-blue-600 hover:bg-blue-700' : ''}
                              >
                                {isInProgress ? (
                                  <>
                                    <Play className="w-4 h-4 mr-1" />
                                    Continue
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-1" />
                                    Start
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(lesson.lesson_url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Internal Training Tab */}
          {activeTab === 'internal' && (
            <>
              {/* Training Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="p-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-xs">
                      Training
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1">{totalCompleted}/{totalModules}</div>
                  <div className="text-blue-100 text-sm">Modules Completed</div>
                  <div className="mt-3 bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white h-full rounded-full transition-all"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Award className="w-5 h-5" />
                    </div>
                    <Star className="w-5 h-5 text-green-200" />
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {modules.filter(m => progress.get(m.id)?.status === 'completed' && m.is_required).length}
                  </div>
                  <div className="text-green-100 text-sm">Certifications Earned</div>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Clock className="w-5 h-5" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-purple-200" />
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {Array.from(progress.values()).reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) / 60 | 0}h
                  </div>
                  <div className="text-purple-100 text-sm">Time Invested</div>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Target className="w-5 h-5" />
                    </div>
                    <Trophy className="w-5 h-5 text-orange-200" />
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {Math.round(
                      Array.from(progress.values())
                        .filter(p => p.quiz_score !== null)
                        .reduce((sum, p, _, arr) => sum + (p.quiz_score || 0) / arr.length, 0)
                    ) || 0}%
                  </div>
                  <div className="text-orange-100 text-sm">Average Quiz Score</div>
                </Card>
              </div>

              {/* Gamification Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="p-4 border-2 border-blue-200 bg-blue-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Trophy className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{stats.totalPoints}</div>
                      <div className="text-xs text-gray-600">Total Points</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-2 border-orange-200 bg-orange-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Flame className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{stats.currentStreak} days</div>
                      <div className="text-xs text-gray-600">Current Streak</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-2 border-green-200 bg-green-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Star className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{stats.rank}</div>
                      <div className="text-xs text-gray-600">Current Rank</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-2 border-purple-200 bg-purple-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{stats.pointsToNextRank}</div>
                      <div className="text-xs text-gray-600">Points to {stats.nextRank}</div>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-6 mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-2">Your Learning Journey</h2>
                    <p className="text-blue-100 text-sm mb-4">
                      Complete all required paths to earn your MPB Health Advisor Certification
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-white h-full rounded-full transition-all"
                            style={{ width: `${overallProgress}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-bold text-lg">{overallProgress}%</span>
                    </div>
                  </div>
                  <div className="ml-6">
                    <Button
                      variant="default"
                      className="bg-white text-blue-600 hover:bg-blue-50"
                      asChild
                    >
                      <Link to="/advisor/training">Browse All Modules</Link>
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning Paths</h2>
                <p className="text-gray-600">
                  Follow structured curricula designed to build your expertise step by step
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {learningPaths.map(path => (
                  <LearningPathCard key={path.id} path={path} />
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-600" />
                    Next Certification
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                      <div className="flex items-start gap-3">
                        <Award className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            MPB Health Certified Advisor
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Complete all required training paths to earn your certification
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {learningPaths.filter(p => p.isRequired && p.completedModules === p.totalModules).length} /{' '}
                              {learningPaths.filter(p => p.isRequired).length} required paths
                            </span>
                            <Badge variant="default" className="bg-yellow-600">In Progress</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link to="/advisor/training">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Browse All Modules
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link to="/advisor/sops">
                        <FileText className="w-4 h-4 mr-2" />
                        SOP Library
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={openExternalTraining}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      MPB Training Platform
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link to="/advisor/dashboard">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Back to Dashboard
                      </Link>
                    </Button>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lesson Embed Modal */}
      {showEmbedModal && selectedLesson && (
        <div
          className={cn(
            'fixed inset-0 z-50 bg-black/80 flex items-center justify-center',
            isFullscreen ? 'p-0' : 'p-4'
          )}
        >
          <div
            className={cn(
              'bg-white rounded-lg overflow-hidden flex flex-col',
              isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[90vh]'
            )}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedLesson.title}</h3>
                  <p className="text-sm text-gray-500">{selectedCourse?.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(selectedLesson.lesson_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open in New Tab
                </Button>
                {selectedLesson.completion?.status !== 'completed' && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleCompleteLesson}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mark Complete
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCloseEmbed}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Iframe Content */}
            <div className="flex-1 relative">
              <iframe
                src={selectedLesson.lesson_url}
                className="absolute inset-0 w-full h-full"
                title={selectedLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedLesson.duration_minutes} min estimated
                </span>
                {selectedLesson.has_video && (
                  <Badge variant="outline">
                    <Video className="w-3 h-3 mr-1" />
                    Video
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Navigation between lessons */}
                {selectedCourse && (
                  <>
                    {(() => {
                      const currentIndex = selectedCourse.lessonsWithProgress.findIndex(
                        l => l.id === selectedLesson.id
                      );
                      const prevLesson = selectedCourse.lessonsWithProgress[currentIndex - 1];
                      const nextLesson = selectedCourse.lessonsWithProgress[currentIndex + 1];

                      return (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!prevLesson}
                            onClick={() => prevLesson && handleStartLesson(prevLesson)}
                          >
                            Previous
                          </Button>
                          <Button
                            size="sm"
                            disabled={!nextLesson}
                            onClick={() => nextLesson && handleStartLesson(nextLesson)}
                          >
                            Next Lesson
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
