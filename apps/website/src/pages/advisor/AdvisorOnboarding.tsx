import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight, Clock, BookOpen, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { advisorAuthService, OnboardingStep, OnboardingProgress, TrainingModule, TrainingProgress, AdvisorProfile } from '../../lib/advisorAuthService';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';

export default function AdvisorOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AdvisorProfile | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState<Map<string, OnboardingProgress>>(new Map());
  const [modules, setModules] = useState<Map<string, TrainingModule>>(new Map());
  const [moduleProgress, setModuleProgress] = useState<Map<string, TrainingProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: user?.email || '',
    phone: '',
    specialization: 'general'
  });

  useEffect(() => {
    loadOnboardingData();
  }, [user]);

  const loadOnboardingData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [profileData, stepsData, progressData, allModules, allProgress] = await Promise.all([
        advisorAuthService.getAdvisorProfile(user.id),
        advisorAuthService.getOnboardingSteps(),
        advisorAuthService.getOnboardingProgress(user.id),
        advisorAuthService.getTrainingModules(),
        advisorAuthService.getTrainingProgress(user.id),
      ]);

      setProfile(profileData);
      if (!profileData) {
        setShowProfileForm(true);
      }

      setSteps(stepsData);

      const progressMap = new Map(progressData.map(p => [p.step_id, p]));
      setProgress(progressMap);

      const modulesMap = new Map(allModules.map(m => [m.id, m]));
      setModules(modulesMap);

      const moduleProgressMap = new Map(allProgress.map(p => [p.module_id, p]));
      setModuleProgress(moduleProgressMap);

      const firstIncompleteIndex = stepsData.findIndex(
        step => !progressData.find(p => p.step_id === step.id && p.status === 'completed')
      );
      setCurrentStepIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : stepsData.length - 1);
    } catch (error) {
      console.error('Error loading onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const newProfile = await advisorAuthService.createAdvisorProfile({
        id: user.id,
        ...profileForm,
        status: 'pending'
      } as any);

      if (newProfile) {
        setProfile(newProfile);
        setShowProfileForm(false);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const _startStep = async (stepId: string) => {
    if (!user) return;
    await advisorAuthService.updateOnboardingProgress(user.id, stepId, 'in_progress');
    await loadOnboardingData();
  };

  const completeStep = async (stepId: string) => {
    if (!user) return;
    await advisorAuthService.updateOnboardingProgress(user.id, stepId, 'completed');

    if (currentStepIndex === steps.length - 1) {
      await advisorAuthService.completeOnboarding(user.id);
      navigate('/advisor/dashboard');
    } else {
      setCurrentStepIndex(prev => prev + 1);
      await loadOnboardingData();
    }
  };

  const getStepStatus = (stepId: string): 'pending' | 'in_progress' | 'completed' => {
    return progress.get(stepId)?.status || 'pending';
  };

  const isStepComplete = (step: OnboardingStep): boolean => {
    const requiredModules = step.required_modules || [];
    return requiredModules.every(moduleId => {
      const prog = moduleProgress.get(moduleId);
      return prog?.status === 'completed';
    });
  };

  const getStepProgress = (step: OnboardingStep): { completed: number; total: number } => {
    const requiredModules = step.required_modules || [];
    const completed = requiredModules.filter(moduleId => {
      const prog = moduleProgress.get(moduleId);
      return prog?.status === 'completed';
    }).length;
    return { completed, total: requiredModules.length };
  };

  const totalProgress = steps.length > 0
    ? (Array.from(progress.values()).filter(p => p.status === 'completed').length / steps.length) * 100
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your onboarding journey...</p>
        </div>
      </div>
    );
  }

  if (showProfileForm && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Advisor Profile</h2>
            <p className="text-gray-600">Let's get started with some basic information</p>
          </div>

          <form onSubmit={handleCreateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  required
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  required
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Select
                id="specialization"
                value={profileForm.specialization}
                onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
              >
                <option value="general">General Health Sharing</option>
                <option value="individual">Individual & Family Plans</option>
                <option value="business">Business & Organizations</option>
                <option value="senior">Senior Plans</option>
              </Select>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Create Profile & Begin Training
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to MPB Health Advisor Training
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete your onboarding journey to become a certified MPB Health advisor
          </p>

          <div className="mt-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Overall Progress</span>
              <span className="font-semibold">{Math.round(totalProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Steps</h2>
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const status = getStepStatus(step.id);
                  const isActive = index === currentStepIndex;

                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStepIndex(index)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-white border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                          {step.title}
                        </p>
                        {step.required_modules.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {getStepProgress(step).completed}/{getStepProgress(step).total} modules
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {currentStep && (
              <Card className="p-8">
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <span>Step {currentStepIndex + 1} of {steps.length}</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    {currentStep.title}
                  </h2>
                  {currentStep.description && (
                    <p className="text-gray-600 text-lg">{currentStep.description}</p>
                  )}
                </div>

                {currentStep.required_modules.length > 0 && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Required Training Modules
                    </h3>
                    <div className="space-y-3">
                      {currentStep.required_modules.map(moduleId => {
                        const module = modules.get(moduleId);
                        const prog = moduleProgress.get(moduleId);

                        if (!module) return null;

                        return (
                          <div
                            key={moduleId}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                {prog?.status === 'completed' ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                )}
                                <div>
                                  <h4 className="font-medium text-gray-900">{module.title}</h4>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {module.duration_minutes} min
                                    </span>
                                    <span className="capitalize">{module.content_type}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant={prog?.status === 'completed' ? 'outline' : 'primary'}
                              size="sm"
                              onClick={() => navigate(`/advisor/training/module/${moduleId}`)}
                            >
                              {prog?.status === 'completed' ? 'Review' : prog?.status === 'in_progress' ? 'Continue' : 'Start'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t">
                  <div className="text-sm text-gray-600">
                    {isStepComplete(currentStep) ? (
                      <span className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        All requirements completed
                      </span>
                    ) : (
                      <span>
                        Complete all required modules to proceed
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {currentStepIndex > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStepIndex(prev => prev - 1)}
                      >
                        Previous
                      </Button>
                    )}
                    {isStepComplete(currentStep) && (
                      <Button
                        variant="primary"
                        onClick={() => completeStep(currentStep.id)}
                        className="flex items-center gap-2"
                      >
                        {currentStepIndex === steps.length - 1 ? 'Complete Onboarding' : 'Next Step'}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
