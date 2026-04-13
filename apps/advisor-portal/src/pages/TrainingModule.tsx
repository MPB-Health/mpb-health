import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  Video,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {
  trainingService,
  type TrainingModule as TrainingModuleType,
  type TrainingProgress,
} from '@mpbhealth/advisor-core';
import { Button } from '@mpbhealth/ui';
import { useAdvisor } from '../contexts/AdvisorContext';
import Training from './Training';

export default function TrainingModule() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { profile, refreshTraining } = useAdvisor();
  const [module, setModule] = useState<TrainingModuleType | null>(null);
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [isMpbCourse, setIsMpbCourse] = useState(false);

  useEffect(() => {
    if (!moduleId || !profile) {
      if (!moduleId) setLoading(false);
      return;
    }
    let cancelled = false;

    const loadModule = async () => {
      try {
        const [mod, prog] = await Promise.all([
          trainingService.getModule(moduleId),
          trainingService.getModuleProgress(profile.id, moduleId),
        ]);
        if (cancelled) return;

        if (
          mod?.category?.toLowerCase().includes('mpb') ||
          mod?.title?.toLowerCase().includes('become an mpb')
        ) {
          setIsMpbCourse(true);
          setLoading(false);
          return;
        }

        setModule(mod);
        setProgress(prog);
      } catch (err) {
        if (cancelled) return;
        toast.error('Failed to load module');
        navigate('/training');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timeout = setTimeout(() => { if (!cancelled) setLoading(false); }, 15_000);
    loadModule();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [moduleId, profile?.id, navigate]);

  const handleStart = async () => {
    if (!profile || !moduleId) return;

    try {
      const prog = await trainingService.startModule(profile.id, moduleId);
      setProgress(prog);
      await refreshTraining();
      toast.success('Module started!');
    } catch (err) {
      toast.error('Failed to start module');
    }
  };

  const handleComplete = async () => {
    if (!profile || !moduleId) return;

    setCompleting(true);
    try {
      const prog = await trainingService.completeModule(profile.id, moduleId);
      setProgress(prog);
      await refreshTraining();
      toast.success('Module completed!');
    } catch (err) {
      toast.error('Failed to complete module');
    } finally {
      setCompleting(false);
    }
  };

  const getContentIcon = () => {
    switch (module?.content_type) {
      case 'video':
        return Video;
      case 'document':
        return FileText;
      case 'interactive':
        return Play;
      default:
        return BookOpen;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
      </div>
    );
  }

  if (isMpbCourse) {
    return <Training section="mpb" />;
  }

  if (!module) {
    return (
      <div className="text-center py-12">
        <p className="text-th-text-tertiary">Module not found</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/training')} className="mt-4 text-th-accent-600 hover:text-th-accent-700">
          Back to Training
        </Button>
      </div>
    );
  }

  const ContentIcon = getContentIcon();
  const isCompleted = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/training')} className="text-th-text-secondary hover:text-th-text-primary">
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Training</span>
      </Button>

      {/* Module header */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                isCompleted
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : isInProgress
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-surface-tertiary'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
              ) : (
                <ContentIcon
                  className={`w-7 h-7 ${
                    isInProgress ? 'text-blue-600 dark:text-blue-400' : 'text-th-text-tertiary'
                  }`}
                />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-th-text-primary">
                  {module.title}
                </h1>
                {module.is_required && (
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                    Required
                  </span>
                )}
              </div>
              <p className="text-th-text-tertiary mt-1">{module.category}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-th-text-tertiary">
            <Clock className="w-5 h-5" />
            <span>{module.duration_minutes} minutes</span>
          </div>
        </div>

        {module.description && (
          <p className="text-th-text-secondary mt-4">{module.description}</p>
        )}

        {/* Progress bar */}
        {isInProgress && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-th-text-tertiary">Progress</span>
              <span className="text-th-text-secondary">
                {progress?.time_spent_minutes || 0} / {module.duration_minutes} min
              </span>
            </div>
            <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    ((progress?.time_spent_minutes || 0) / module.duration_minutes) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Module content */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {module.content_type === 'video' && module.content_url && (
          <div className="aspect-video bg-neutral-900 dark:bg-black">
            <iframe
              src={module.content_url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {module.content_type === 'external_link' && module.content_url && (
          <div className="p-6">
            <a
              href={module.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 py-4 px-6 bg-th-accent-50 text-th-accent-700 rounded-lg hover:bg-th-accent-100 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Open External Content</span>
            </a>
          </div>
        )}

        {(module.content_type === 'document' ||
          module.content_type === 'interactive') && (
          <div className="p-6">
            <div className="prose max-w-none dark:prose-invert">
              {/* Document content would be rendered here */}
              <p className="text-th-text-tertiary text-center py-8">
                Document content would be displayed here
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between bg-surface-primary rounded-xl border border-th-border p-4">
        {isCompleted ? (
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Module Completed</span>
          </div>
        ) : !progress ? (
          <Button type="button" variant="primary" onClick={handleStart}>
            <Play className="w-5 h-5" />
            <span>Start Module</span>
          </Button>
        ) : (
          <div className="text-th-text-tertiary">
            Time spent: {progress.time_spent_minutes} minutes
          </div>
        )}

        {isInProgress && (
          <Button
            type="button"
            variant="primary"
            onClick={handleComplete}
            disabled={completing}
            className="bg-green-600 hover:bg-green-700"
          >
            {completing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            <span>Mark Complete</span>
          </Button>
        )}
      </div>
    </div>
  );
}
