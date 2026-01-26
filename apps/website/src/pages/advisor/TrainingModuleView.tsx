import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  PlayCircle,
  FileText,
  Video,
  ExternalLink,
  Award,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  advisorAuthService,
  TrainingModule,
  TrainingProgress,
} from '../../lib/advisorAuthService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export default function TrainingModuleView() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [module, setModule] = useState<TrainingModule | null>(null);
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState<Date>(new Date());
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  // Quiz score state - setter will be used when quiz system is integrated
  const [quizScore, setQuizScore] = useState<number | undefined>();

  useEffect(() => {
    loadModuleData();
  }, [moduleId, user]);

  const loadModuleData = async () => {
    if (!user || !moduleId) return;

    try {
      setLoading(true);
      const [modulesData, progressData] = await Promise.all([
        advisorAuthService.getTrainingModules(),
        advisorAuthService.getTrainingProgress(user.id, moduleId),
      ]);

      const moduleData = modulesData.find(m => m.id === moduleId);
      setModule(moduleData || null);
      setProgress(progressData[0] || null);

      if (!progressData[0] || progressData[0].status === 'not_started') {
        await advisorAuthService.startModule(user.id, moduleId);
        const updatedProgress = await advisorAuthService.getTrainingProgress(user.id, moduleId);
        setProgress(updatedProgress[0] || null);
      }
    } catch (error) {
      console.error('Error loading module:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeSpent = (): number => {
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    return Math.round(diffMs / 60000);
  };

  const handleComplete = async () => {
    if (!user || !moduleId) return;

    const timeSpent = calculateTimeSpent();
    await advisorAuthService.completeModule(user.id, moduleId, timeSpent, quizScore);

    if (module?.is_required) {
      setShowCompletionDialog(true);
    } else {
      navigate('/advisor/training');
    }
  };

  const getContentIcon = () => {
    if (!module) return FileText;
    switch (module.content_type) {
      case 'video':
        return Video;
      case 'external_link':
        return ExternalLink;
      default:
        return FileText;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading module...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Module Not Found</h2>
          <p className="text-gray-600 mb-6">
            The training module you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/advisor/training">Back to Training</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const ContentIcon = getContentIcon();
  const isCompleted = progress?.status === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/advisor/training"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Training
          </Link>
        </div>

        <Card className="p-8 mb-6">
          <div className="flex items-start gap-6 mb-6">
            <div className="p-4 bg-blue-100 rounded-xl flex-shrink-0">
              <ContentIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{module.title}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {module.content_type.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="outline">{module.category.replace(/_/g, ' ')}</Badge>
                    {module.is_required && (
                      <Badge variant="default" className="bg-red-600">Required</Badge>
                    )}
                    {isCompleted && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {module.duration_minutes} minutes
                </span>
                {progress && progress.attempts > 0 && (
                  <span>Attempts: {progress.attempts}</span>
                )}
                {progress?.quiz_score && (
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    Score: {progress.quiz_score}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {module.description && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-700">{module.description}</p>
            </div>
          )}

          {module.prerequisites && module.prerequisites.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                Prerequisites
              </h3>
              <p className="text-sm text-gray-600">
                This module has {module.prerequisites.length} prerequisite(s) that should be completed first.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-blue-600" />
            Training Content
          </h2>

          {module.content_type === 'video' && module.content_url && (
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
              <iframe
                src={module.content_url}
                className="w-full h-full"
                allowFullScreen
                title={module.title}
              />
            </div>
          )}

          {module.content_type === 'external_link' && module.content_url && (
            <div className="p-6 bg-blue-50 rounded-lg text-center">
              <ExternalLink className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                External Training Resource
              </h3>
              <p className="text-gray-600 mb-4">
                This module links to external training content
              </p>
              <Button
                variant="primary"
                onClick={() => window.open(module.content_url!, '_blank')}
                className="inline-flex items-center gap-2"
              >
                Open Training Resource
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          )}

          {module.content_type === 'document' && (
            <div className="prose max-w-none">
              <p className="text-gray-600 mb-4">
                Review the training materials and complete any exercises or assessments.
              </p>
              {module.content_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(module.content_url!, '_blank')}
                  className="mb-4"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Document
                </Button>
              )}
            </div>
          )}

          {module.content_type === 'quiz' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Complete the quiz to test your knowledge on this topic.
              </p>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> Quiz functionality will be available when you integrate your quiz system.
                </p>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              {isCompleted ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Module Completed</span>
                </div>
              ) : (
                <p className="text-gray-600">
                  Mark this module as complete when you're finished
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {!isCompleted && (
                <Button variant="primary" onClick={handleComplete}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete Module
                </Button>
              )}
              {isCompleted && (
                <Button variant="outline" asChild>
                  <Link to="/advisor/training">Back to Training</Link>
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {showCompletionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Module Completed!</h2>
            <p className="text-gray-600 mb-6">
              Great job! You've successfully completed this required training module.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/advisor/dashboard')}
                className="flex-1"
              >
                Dashboard
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/advisor/training')}
                className="flex-1"
              >
                Continue Training
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
