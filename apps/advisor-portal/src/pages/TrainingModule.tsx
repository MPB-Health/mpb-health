import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useAdvisorQueryReady } from '../hooks/useAdvisorQueryReady';
import Training from './Training';
import { useAdvisorPageDebugLog } from '../hooks/useAdvisorPageDebugLog';
import { AdvisorPageLoader } from '../components/loading';

type TrainingModulePageData =
  | { kind: 'mpb' }
  | { kind: 'normal'; module: TrainingModuleType | null; progress: TrainingProgress | null };

export default function TrainingModule() {
  useAdvisorPageDebugLog('TrainingModule');
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, refreshTraining } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const [completing, setCompleting] = useState(false);

  const { data, isPending: queryPending, isError } = useQuery({
    queryKey: ['advisorTrainingModule', moduleId, profile?.id],
    queryFn: async (): Promise<TrainingModulePageData> => {
      const mod = await trainingService.getModule(moduleId!);
      const prog = await trainingService.getModuleProgress(profile!.id, moduleId!);
      if (!mod) {
        return { kind: 'normal', module: null, progress: prog };
      }
      if (
        mod.category?.toLowerCase().includes('mpb') ||
        mod.title?.toLowerCase().includes('become an mpb')
      ) {
        return { kind: 'mpb' };
      }
      return { kind: 'normal', module: mod, progress: prog };
    },
    enabled: Boolean(advisorReady && moduleId && profile?.id),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const isMpbCourse = data?.kind === 'mpb';
  const trainingModule = data?.kind === 'normal' ? data.module : null;
  const progress = data?.kind === 'normal' ? data.progress : null;

  const loading = !moduleId ? false : !advisorReady || queryPending;

  useEffect(() => {
    if (!isError || !moduleId || !advisorReady) return;
    toast.error('Failed to load module');
    navigate('/training');
  }, [isError, moduleId, advisorReady, navigate]);

  const handleStart = async () => {
    if (!profile || !moduleId || !trainingModule) return;

    try {
      const prog = await trainingService.startModule(profile.id, moduleId);
      queryClient.setQueryData<TrainingModulePageData>(
        ['advisorTrainingModule', moduleId, profile.id],
        (old) =>
          old?.kind === 'normal'
            ? { ...old, progress: prog }
            : { kind: 'normal', module: trainingModule, progress: prog },
      );
      await refreshTraining();
      toast.success('Module started!');
    } catch (err) {
      toast.error('Failed to start module');
    }
  };

  const handleComplete = async () => {
    if (!profile || !moduleId || !trainingModule) return;

    setCompleting(true);
    try {
      const prog = await trainingService.completeModule(profile.id, moduleId);
      queryClient.setQueryData<TrainingModulePageData>(
        ['advisorTrainingModule', moduleId, profile.id],
        (old) =>
          old?.kind === 'normal'
            ? { ...old, progress: prog }
            : { kind: 'normal', module: trainingModule, progress: prog },
      );
      await refreshTraining();
      toast.success('Module completed!');
    } catch (err) {
      toast.error('Failed to complete module');
    } finally {
      setCompleting(false);
    }
  };

  const getContentIcon = () => {
    switch (trainingModule?.content_type) {
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
      <AdvisorPageLoader
        message="Loading training module…"
        subtitle="Preparing lessons and your progress."
      />
    );
  }

  if (isMpbCourse) {
    return <Training section="mpb" />;
  }

  if (!trainingModule) {
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
                  {trainingModule.title}
                </h1>
                {trainingModule.is_required && (
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                    Required
                  </span>
                )}
              </div>
              <p className="text-th-text-tertiary mt-1">{trainingModule.category}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-th-text-tertiary">
            <Clock className="w-5 h-5" />
            <span>{trainingModule.duration_minutes} minutes</span>
          </div>
        </div>

        {trainingModule.description && (
          <p className="text-th-text-secondary mt-4">{trainingModule.description}</p>
        )}

        {/* Progress bar */}
        {isInProgress && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-th-text-tertiary">Progress</span>
              <span className="text-th-text-secondary">
                {progress?.time_spent_minutes || 0} / {trainingModule.duration_minutes} min
              </span>
            </div>
            <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    ((progress?.time_spent_minutes || 0) / trainingModule.duration_minutes) * 100,
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
        {trainingModule.content_type === 'video' && trainingModule.content_url && (
          <div className="aspect-video bg-neutral-900 dark:bg-black">
            <iframe
              src={trainingModule.content_url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {trainingModule.content_type === 'external_link' && trainingModule.content_url && (
          <div className="p-6">
            <a
              href={trainingModule.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 py-4 px-6 bg-th-accent-50 text-th-accent-700 rounded-lg hover:bg-th-accent-100 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Open External Content</span>
            </a>
          </div>
        )}

        {(trainingModule.content_type === 'document' ||
          trainingModule.content_type === 'interactive') && (
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
