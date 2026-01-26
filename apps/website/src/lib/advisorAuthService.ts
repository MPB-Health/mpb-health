import { supabase } from './supabase';

export interface AdvisorProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  specialization: string;
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content_type: 'video' | 'document' | 'interactive' | 'quiz' | 'external_link';
  content_url: string | null;
  duration_minutes: number;
  order_index: number;
  is_required: boolean;
  prerequisites: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingProgress {
  id: string;
  advisor_id: string;
  module_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  started_at: string | null;
  completed_at: string | null;
  time_spent_minutes: number;
  quiz_score: number | null;
  attempts: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SOPDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  content: string | null;
  file_url: string | null;
  version: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Certification {
  id: string;
  advisor_id: string;
  certification_type: string;
  earned_at: string;
  expires_at: string | null;
  badge_url: string | null;
  created_at: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  required_modules: string[];
  required_forms: string[];
  is_active: boolean;
  created_at: string;
}

export interface OnboardingProgress {
  id: string;
  advisor_id: string;
  step_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const advisorAuthService = {
  async getAdvisorProfile(userId: string): Promise<AdvisorProfile | null> {
    const { data, error } = await supabase
      .from('advisor_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching advisor profile:', error);
      return null;
    }

    return data;
  },

  async createAdvisorProfile(profile: Omit<AdvisorProfile, 'id' | 'created_at' | 'updated_at' | 'onboarding_completed' | 'onboarding_completed_at' | 'metadata'>): Promise<AdvisorProfile | null> {
    const { data, error } = await supabase
      .from('advisor_profiles')
      .insert([profile])
      .select()
      .single();

    if (error) {
      console.error('Error creating advisor profile:', error);
      return null;
    }

    return data;
  },

  async updateAdvisorProfile(userId: string, updates: Partial<AdvisorProfile>): Promise<AdvisorProfile | null> {
    const { data, error } = await supabase
      .from('advisor_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating advisor profile:', error);
      return null;
    }

    return data;
  },

  async completeOnboarding(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('advisor_profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error completing onboarding:', error);
      return false;
    }

    return true;
  },

  async getTrainingModules(category?: string): Promise<TrainingModule[]> {
    let query = supabase
      .from('training_modules')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching training modules:', error);
      return [];
    }

    return data || [];
  },

  async getTrainingProgress(advisorId: string, moduleId?: string): Promise<TrainingProgress[]> {
    let query = supabase
      .from('training_progress')
      .select('*')
      .eq('advisor_id', advisorId);

    if (moduleId) {
      query = query.eq('module_id', moduleId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching training progress:', error);
      return [];
    }

    return data || [];
  },

  async startModule(advisorId: string, moduleId: string): Promise<TrainingProgress | null> {
    const { data, error } = await supabase
      .from('training_progress')
      .upsert({
        advisor_id: advisorId,
        module_id: moduleId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        attempts: 1,
      }, {
        onConflict: 'advisor_id,module_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting module:', error);
      return null;
    }

    return data;
  },

  async completeModule(
    advisorId: string,
    moduleId: string,
    timeSpent: number,
    quizScore?: number
  ): Promise<TrainingProgress | null> {
    const { data, error } = await supabase
      .from('training_progress')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        time_spent_minutes: timeSpent,
        quiz_score: quizScore,
      })
      .eq('advisor_id', advisorId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) {
      console.error('Error completing module:', error);
      return null;
    }

    return data;
  },

  async updateModuleProgress(
    advisorId: string,
    moduleId: string,
    updates: Partial<TrainingProgress>
  ): Promise<TrainingProgress | null> {
    const { data, error } = await supabase
      .from('training_progress')
      .update(updates)
      .eq('advisor_id', advisorId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating module progress:', error);
      return null;
    }

    return data;
  },

  async getSOPDocuments(category?: string): Promise<SOPDocument[]> {
    let query = supabase
      .from('sop_documents')
      .select('*')
      .eq('is_active', true)
      .order('title', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching SOP documents:', error);
      return [];
    }

    return data || [];
  },

  async searchSOPs(searchTerm: string): Promise<SOPDocument[]> {
    const { data, error } = await supabase
      .from('sop_documents')
      .select('*')
      .eq('is_active', true)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
      .order('title', { ascending: true });

    if (error) {
      console.error('Error searching SOPs:', error);
      return [];
    }

    return data || [];
  },

  async getCertifications(advisorId: string): Promise<Certification[]> {
    const { data, error } = await supabase
      .from('certifications')
      .select('*')
      .eq('advisor_id', advisorId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error fetching certifications:', error);
      return [];
    }

    return data || [];
  },

  async awardCertification(
    advisorId: string,
    certificationType: string,
    badgeUrl?: string,
    expiresAt?: string
  ): Promise<Certification | null> {
    const { data, error } = await supabase
      .from('certifications')
      .insert({
        advisor_id: advisorId,
        certification_type: certificationType,
        badge_url: badgeUrl,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Error awarding certification:', error);
      return null;
    }

    return data;
  },

  async getOnboardingSteps(): Promise<OnboardingStep[]> {
    const { data, error } = await supabase
      .from('onboarding_steps')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching onboarding steps:', error);
      return [];
    }

    return data || [];
  },

  async getOnboardingProgress(advisorId: string): Promise<OnboardingProgress[]> {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('advisor_id', advisorId);

    if (error) {
      console.error('Error fetching onboarding progress:', error);
      return [];
    }

    return data || [];
  },

  async updateOnboardingProgress(
    advisorId: string,
    stepId: string,
    status: 'pending' | 'in_progress' | 'completed'
  ): Promise<OnboardingProgress | null> {
    const updates: any = { status };
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('onboarding_progress')
      .upsert({
        advisor_id: advisorId,
        step_id: stepId,
        ...updates,
      }, {
        onConflict: 'advisor_id,step_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating onboarding progress:', error);
      return null;
    }

    return data;
  },

  async getTrainingStats(advisorId: string): Promise<{
    totalModules: number;
    completedModules: number;
    inProgressModules: number;
    totalTimeSpent: number;
    avgQuizScore: number;
    certifications: number;
  }> {
    const [progress, certs] = await Promise.all([
      this.getTrainingProgress(advisorId),
      this.getCertifications(advisorId),
    ]);

    const completed = progress.filter(p => p.status === 'completed');
    const inProgress = progress.filter(p => p.status === 'in_progress');
    const totalTime = completed.reduce((sum, p) => sum + p.time_spent_minutes, 0);
    const scoresWithValues = completed.filter(p => p.quiz_score !== null).map(p => p.quiz_score!);
    const avgScore = scoresWithValues.length > 0
      ? scoresWithValues.reduce((sum, score) => sum + score, 0) / scoresWithValues.length
      : 0;

    return {
      totalModules: progress.length,
      completedModules: completed.length,
      inProgressModules: inProgress.length,
      totalTimeSpent: totalTime,
      avgQuizScore: Math.round(avgScore),
      certifications: certs.length,
    };
  },
};
