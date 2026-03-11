import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  User,
  Zap,
  Inbox,
  Bot,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { useOnboarding, type OnboardingStep } from '../../hooks/useOnboarding';
import { Button, cn } from '@mpbhealth/ui';

const STEP_ICONS: Record<string, React.ElementType> = {
  sparkles: Sparkles,
  user: User,
  zap: Zap,
  inbox: Inbox,
  bot: Bot,
  'check-circle': CheckCircle,
};

export function OnboardingWizard() {
  const navigate = useNavigate();
  const {
    isWizardOpen,
    currentStepConfig,
    currentStepIndex,
    progress,
    steps,
    totalSteps,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    closeWizard,
  } = useOnboarding();

  // Handle keyboard navigation
  useEffect(() => {
    if (!isWizardOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeWizard();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStepConfig.id === 'complete') {
          completeOnboarding();
        } else {
          nextStep();
        }
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWizardOpen, currentStepConfig, nextStep, prevStep, closeWizard, completeOnboarding]);

  if (!isWizardOpen) {
    return null;
  }

  const Icon = STEP_ICONS[currentStepConfig.icon] || Sparkles;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepConfig.id === 'complete';

  const handlePrimaryAction = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  const handleNavigateToFeature = (path: string) => {
    closeWizard();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={skipOnboarding}
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="pt-12 pb-6 px-8">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    index < currentStepIndex
                      ? 'bg-primary-500 text-white'
                      : index === currentStepIndex
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                  )}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-8 h-0.5 mx-1',
                      index < currentStepIndex
                        ? 'bg-primary-500'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className={cn(
                'w-20 h-20 rounded-2xl flex items-center justify-center',
                isLastStep
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-primary-100 dark:bg-primary-900/30'
              )}
            >
              <Icon
                className={cn(
                  'w-10 h-10',
                  isLastStep
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-primary-600 dark:text-primary-400'
                )}
              />
            </div>
          </div>

          {/* Title & Description */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              {currentStepConfig.title}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {currentStepConfig.description}
            </p>
          </div>

          {/* Step-specific content */}
          {currentStepConfig.id === 'power-list' && (
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 mb-6">
              <div className="space-y-3">
                <FeatureItem
                  label="Priority Lanes"
                  description="Hot, Warm, Nurture lanes organize your leads"
                />
                <FeatureItem
                  label="Lead Scoring"
                  description="AI scores leads so you focus on the best ones"
                />
                <FeatureItem
                  label="Quick Actions"
                  description="Call, email, or snooze with one click"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleNavigateToFeature('/power-list')}
                className="mt-4 w-full text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
              >
                <span>View Power List</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {currentStepConfig.id === 'inbox' && (
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 mb-6">
              <div className="space-y-3">
                <FeatureItem
                  label="Unified Conversations"
                  description="Email and SMS in one thread per lead"
                />
                <FeatureItem
                  label="Message Templates"
                  description="Save time with reusable templates"
                />
                <FeatureItem
                  label="Sequences"
                  description="Automated multi-step outreach"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleNavigateToFeature('/inbox')}
                className="mt-4 w-full text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
              >
                <span>View Inbox</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {currentStepConfig.id === 'automations' && (
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 mb-6">
              <div className="space-y-3">
                <FeatureItem
                  label="Triggers"
                  description="React to lead events automatically"
                />
                <FeatureItem
                  label="Actions"
                  description="Send emails, create tasks, assign leads"
                />
                <FeatureItem
                  label="Templates"
                  description="Start with pre-built automation recipes"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleNavigateToFeature('/automations')}
                className="mt-4 w-full text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
              >
                <span>View Automations</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {currentStepConfig.id === 'profile' && (
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 mb-6">
              <div className="space-y-3">
                <FeatureItem
                  label="Profile Photo"
                  description="Help leads recognize you"
                />
                <FeatureItem
                  label="Contact Info"
                  description="Your phone and email for outreach"
                />
                <FeatureItem
                  label="Specialization"
                  description="What types of clients you serve"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleNavigateToFeature('/profile')}
                className="mt-4 w-full text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
              >
                <span>Edit Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {isLastStep && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Profile set up</span>
                </div>
                <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Power List explored</span>
                </div>
                <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Inbox ready</span>
                </div>
                <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Automations unlocked</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <div>
              {!isFirstStep && !isLastStep && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isLastStep && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={skipOnboarding}
                >
                  Skip
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                onClick={handlePrimaryAction}
                className={isLastStep ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <span>{isLastStep ? 'Get Started' : 'Continue'}</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="px-8 pb-4 flex items-center justify-center gap-4 text-xs text-neutral-400">
          <span>
            <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-mono">
              ←
            </kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-mono">
              →
            </kbd>{' '}
            to navigate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-mono">
              Esc
            </kbd>{' '}
            to close
          </span>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 mt-2 rounded-full bg-primary-500" />
      <div>
        <p className="font-medium text-neutral-900 dark:text-white">{label}</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
      </div>
    </div>
  );
}

export default OnboardingWizard;
