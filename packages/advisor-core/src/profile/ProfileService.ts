import { supabase } from '@mpbhealth/database';
import type { AdvisorProfile, OnboardingStep, OnboardingProgress } from '../types';

export class ProfileService {
  // Helper to normalize profile data (adds user_id from id if missing)
  private normalizeProfile(data: Record<string, unknown> | null): AdvisorProfile | null {
    if (!data) return null;
    return {
      ...data,
      user_id: (data.user_id as string) || (data.id as string),
      org_id: (data.org_id as string) || '',
    } as AdvisorProfile;
  }

  // Get advisor profile
  async getProfile(advisorId: string): Promise<AdvisorProfile | null> {
    const { data, error } = await supabase
      .from('advisor_profiles')
      .select('*')
      .eq('id', advisorId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return this.normalizeProfile(data);
  }

  // Get profile by email
  async getProfileByEmail(email: string): Promise<AdvisorProfile | null> {
    const { data, error } = await supabase
      .from('advisor_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return this.normalizeProfile(data);
  }

  // Update profile
  async updateProfile(
    advisorId: string,
    updates: Partial<Omit<AdvisorProfile, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<AdvisorProfile> {
    const { data, error } = await supabase
      .from('advisor_profiles')
      .update(updates)
      .eq('id', advisorId)
      .select()
      .single();

    if (error) throw error;
    return this.normalizeProfile(data)!;
  }

  // Upload avatar
  async uploadAvatar(advisorId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${advisorId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('advisor-avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('advisor-avatars')
      .getPublicUrl(fileName);

    // Update profile with avatar URL
    await this.updateProfile(advisorId, { avatar_url: data.publicUrl });

    return data.publicUrl;
  }

  // Get all advisors (for directory)
  async getAllAdvisors(filters?: {
    status?: string;
    specialization?: string;
    search?: string;
  }): Promise<AdvisorProfile[]> {
    let query = supabase
      .from('advisor_profiles')
      .select('*')
      .order('last_name', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.specialization) {
      query = query.eq('specialization', filters.specialization);
    }
    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(d => this.normalizeProfile(d)!);
  }

  // Get active advisors
  async getActiveAdvisors(): Promise<AdvisorProfile[]> {
    return this.getAllAdvisors({ status: 'active' });
  }

  // Get specializations
  async getSpecializations(): Promise<string[]> {
    const { data, error } = await supabase
      .from('advisor_profiles')
      .select('specialization');

    if (error) throw error;

    const specializations = [...new Set(data?.map(a => a.specialization) || [])];
    return specializations.filter(Boolean).sort();
  }

  // ========== Onboarding ==========

  // Get onboarding steps
  async getOnboardingSteps(): Promise<OnboardingStep[]> {
    const { data, error } = await supabase
      .from('onboarding_steps')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get advisor's onboarding progress
  async getOnboardingProgress(advisorId: string): Promise<OnboardingProgress[]> {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('advisor_id', advisorId);

    if (error) throw error;
    return data || [];
  }

  // Get complete onboarding status
  async getOnboardingStatus(advisorId: string): Promise<{
    steps: (OnboardingStep & { progress?: OnboardingProgress })[];
    completedCount: number;
    totalCount: number;
    isComplete: boolean;
    currentStep: OnboardingStep | null;
  }> {
    const [steps, progress] = await Promise.all([
      this.getOnboardingSteps(),
      this.getOnboardingProgress(advisorId),
    ]);

    const progressMap = new Map(progress.map(p => [p.step_id, p]));

    const stepsWithProgress = steps.map(step => ({
      ...step,
      progress: progressMap.get(step.id),
    }));

    const completedCount = progress.filter(p => p.status === 'completed').length;
    const isComplete = completedCount === steps.filter(s => s.is_required).length;

    // Find current step (first incomplete required step)
    const currentStep = stepsWithProgress.find(
      s => s.is_required && s.progress?.status !== 'completed'
    ) || null;

    return {
      steps: stepsWithProgress,
      completedCount,
      totalCount: steps.length,
      isComplete,
      currentStep,
    };
  }

  // Start an onboarding step
  async startOnboardingStep(
    advisorId: string,
    stepId: string
  ): Promise<OnboardingProgress> {
    // Check if progress exists
    const { data: existing } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('advisor_id', advisorId)
      .eq('step_id', stepId)
      .single();

    if (existing) {
      if (existing.status === 'pending') {
        const { data, error } = await supabase
          .from('onboarding_progress')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
      return existing;
    }

    // Create new progress
    const { data, error } = await supabase
      .from('onboarding_progress')
      .insert({
        advisor_id: advisorId,
        step_id: stepId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Complete an onboarding step
  async completeOnboardingStep(
    advisorId: string,
    stepId: string,
    notes?: string
  ): Promise<OnboardingProgress> {
    const progress = await this.startOnboardingStep(advisorId, stepId);

    const { data, error } = await supabase
      .from('onboarding_progress')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes,
      })
      .eq('id', progress.id)
      .select()
      .single();

    if (error) throw error;

    // Check if all required steps are complete
    const status = await this.getOnboardingStatus(advisorId);
    if (status.isComplete) {
      await this.updateProfile(advisorId, {
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      });
    }

    return data;
  }

  // Skip an optional onboarding step
  async skipOnboardingStep(
    advisorId: string,
    stepId: string
  ): Promise<OnboardingProgress> {
    // Verify step is optional
    const { data: step } = await supabase
      .from('onboarding_steps')
      .select('is_required')
      .eq('id', stepId)
      .single();

    if (step?.is_required) {
      throw new Error('Cannot skip required onboarding step');
    }

    const progress = await this.startOnboardingStep(advisorId, stepId);

    const { data, error } = await supabase
      .from('onboarding_progress')
      .update({
        status: 'skipped',
        completed_at: new Date().toISOString(),
      })
      .eq('id', progress.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get advisor stats
  async getAdvisorStats(advisorId: string): Promise<{
    trainingProgress: number;
    onboardingProgress: number;
    meetingsAttended: number;
    formsSubmitted: number;
    certificationsEarned: number;
  }> {
    const [
      trainingProgress,
      onboardingStatus,
      meetingsAttended,
      formsSubmitted,
      certifications,
    ] = await Promise.all([
      supabase
        .from('training_progress')
        .select('status')
        .eq('advisor_id', advisorId)
        .then(r => {
          const total = r.data?.length || 0;
          const completed = r.data?.filter(p => p.status === 'completed').length || 0;
          return total > 0 ? (completed / total) * 100 : 0;
        }),
      this.getOnboardingStatus(advisorId),
      supabase
        .from('meeting_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('advisor_id', advisorId)
        .then(r => r.count || 0),
      supabase
        .from('form_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('advisor_id', advisorId)
        .then(r => r.count || 0),
      supabase
        .from('certifications')
        .select('*', { count: 'exact', head: true })
        .eq('advisor_id', advisorId)
        .then(r => r.count || 0),
    ]);

    return {
      trainingProgress,
      onboardingProgress: onboardingStatus.totalCount > 0
        ? (onboardingStatus.completedCount / onboardingStatus.totalCount) * 100
        : 0,
      meetingsAttended,
      formsSubmitted,
      certificationsEarned: certifications,
    };
  }
}

export const profileService = new ProfileService();
