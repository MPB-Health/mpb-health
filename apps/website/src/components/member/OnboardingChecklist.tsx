import React, { useState, useEffect } from 'react';
import { Check, Circle, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  link: string;
  estimatedTime: string;
  required: boolean;
}

const checklistItems: ChecklistItem[] = [
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add your contact information and preferences',
    link: '/member/profile',
    estimatedTime: '2 min',
    required: true,
  },
  {
    id: 'payment',
    title: 'Set Up Payment Method',
    description: 'Add your payment information for monthly contributions',
    link: '/member/billing',
    estimatedTime: '3 min',
    required: true,
  },
  {
    id: 'documents',
    title: 'Upload Required Documents',
    description: 'Submit ID and any necessary medical documents',
    link: '/member/documents',
    estimatedTime: '5 min',
    required: true,
  },
  {
    id: 'advisor',
    title: 'Meet Your Advisor',
    description: 'Schedule a welcome call with your dedicated advisor',
    link: '/member/forms/welcome-call',
    estimatedTime: '1 min',
    required: false,
  },
  {
    id: 'app',
    title: 'Download Mobile App',
    description: 'Get the MPB Health app for easy access on the go',
    link: '/download',
    estimatedTime: '2 min',
    required: false,
  },
  {
    id: 'tour',
    title: 'Take the Portal Tour',
    description: 'Learn how to submit needs and track sharing',
    link: '/member/tour',
    estimatedTime: '5 min',
    required: false,
  },
];

export const OnboardingChecklist: React.FC<{ userId: string }> = ({ userId }) => {
  const [completed, setCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = async () => {
    try {
      const { data, error: _error } = await supabase
        .from('onboarding_progress')
        .select('completed_steps')
        .eq('user_id', userId)
        .single();

      if (data) {
        setCompleted(data.completed_steps || []);
      }
    } catch (err) {
      console.error('Failed to load onboarding progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = async (stepId: string) => {
    const newCompleted = completed.includes(stepId)
      ? completed.filter(id => id !== stepId)
      : [...completed, stepId];

    setCompleted(newCompleted);

    try {
      await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: userId,
          completed_steps: newCompleted,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  };

  const requiredCompleted = checklistItems
    .filter(item => item.required)
    .filter(item => completed.includes(item.id))
    .length;

  const requiredTotal = checklistItems.filter(item => item.required).length;
  const totalCompleted = completed.length;
  const totalItems = checklistItems.length;
  const progress = (totalCompleted / totalItems) * 100;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-1/2"></div>
          <div className="h-4 bg-neutral-200 rounded"></div>
          <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to MPB Health!</h2>
        <p className="text-white/90 mb-6">
          Complete these steps to get the most out of your membership
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="font-bold">{totalCompleted} / {totalItems} completed</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Required Steps</span>
            <span className="font-bold">{requiredCompleted} / {requiredTotal}</span>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="p-8">
        <div className="space-y-4">
          {checklistItems.map((item, index) => {
            const isCompleted = completed.includes(item.id);
            const isLocked = item.required && index > 0 && !completed.includes(checklistItems[index - 1].id);

            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-xl border-2 transition-all',
                  isCompleted
                    ? 'border-green-200 bg-green-50'
                    : isLocked
                    ? 'border-neutral-200 bg-neutral-50 opacity-50'
                    : 'border-neutral-200 hover:border-blue-300 hover:bg-blue-50'
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={() => !isLocked && toggleStep(item.id)}
                  disabled={isLocked}
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all',
                    isCompleted
                      ? 'bg-green-600 border-green-600'
                      : isLocked
                      ? 'bg-neutral-200 border-neutral-300 cursor-not-allowed'
                      : 'border-neutral-300 hover:border-blue-600'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : isLocked ? (
                    <Lock className="h-4 w-4 text-neutral-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-neutral-400" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className={cn(
                        'font-semibold mb-1',
                        isCompleted ? 'text-green-900' : 'text-neutral-900'
                      )}>
                        {item.title}
                        {item.required && (
                          <span className="ml-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            REQUIRED
                          </span>
                        )}
                      </h3>
                      <p className={cn(
                        'text-sm',
                        isCompleted ? 'text-green-700' : 'text-neutral-600'
                      )}>
                        {item.description}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-neutral-500 whitespace-nowrap">
                      {item.estimatedTime}
                    </span>
                  </div>

                  {!isCompleted && !isLocked && (
                    <Link to={item.link}>
                      <button className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                        Start Now
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </Link>
                  )}

                  {isCompleted && (
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                      <Check className="h-4 w-4" />
                      Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {requiredCompleted === requiredTotal && (
          <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-green-900 mb-2">
                  🎉 You're all set!
                </h3>
                <p className="text-green-700 mb-4">
                  You've completed all required steps. Feel free to explore the optional items or start using your membership!
                </p>
                <Link to="/member/portal">
                  <button className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl">
                    Go to Member Portal
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
