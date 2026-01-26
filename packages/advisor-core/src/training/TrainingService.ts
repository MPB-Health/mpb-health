import { supabase } from '@mpbhealth/database';
import type {
  TrainingModule,
  TrainingProgress,
  TrainingCategory,
  Certification,
} from '../types';

export class TrainingService {
  // Get all training modules
  async getModules(category?: string): Promise<TrainingModule[]> {
    let query = supabase
      .from('training_modules')
      .select('*')
      .order('order_index', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Get a single module by ID
  async getModule(moduleId: string): Promise<TrainingModule | null> {
    const { data, error } = await supabase
      .from('training_modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Get training categories
  async getCategories(): Promise<TrainingCategory[]> {
    const { data, error } = await supabase
      .from('training_categories')
      .select('*, module_count:training_modules(count)')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get advisor's progress for all modules
  async getAdvisorProgress(advisorId: string): Promise<TrainingProgress[]> {
    const { data, error } = await supabase
      .from('training_progress')
      .select('*')
      .eq('advisor_id', advisorId);

    if (error) throw error;
    return data || [];
  }

  // Get progress for a specific module
  async getModuleProgress(
    advisorId: string,
    moduleId: string
  ): Promise<TrainingProgress | null> {
    const { data, error } = await supabase
      .from('training_progress')
      .select('*')
      .eq('advisor_id', advisorId)
      .eq('module_id', moduleId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Start a training module
  async startModule(advisorId: string, moduleId: string): Promise<TrainingProgress> {
    // Check if progress exists
    const existing = await this.getModuleProgress(advisorId, moduleId);

    if (existing) {
      // Update to in_progress if not started
      if (existing.status === 'not_started') {
        const { data, error } = await supabase
          .from('training_progress')
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

    // Create new progress record
    const { data, error } = await supabase
      .from('training_progress')
      .insert({
        advisor_id: advisorId,
        module_id: moduleId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        time_spent_minutes: 0,
        quiz_attempts: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update progress (time spent, position)
  async updateProgress(
    progressId: string,
    updates: Partial<Pick<TrainingProgress, 'time_spent_minutes' | 'last_position'>>
  ): Promise<TrainingProgress> {
    const { data, error } = await supabase
      .from('training_progress')
      .update(updates)
      .eq('id', progressId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Complete a module
  async completeModule(
    advisorId: string,
    moduleId: string,
    quizScore?: number
  ): Promise<TrainingProgress> {
    const progress = await this.getModuleProgress(advisorId, moduleId);

    if (!progress) {
      throw new Error('Progress record not found');
    }

    const { data, error } = await supabase
      .from('training_progress')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        quiz_score: quizScore ?? progress.quiz_score,
        quiz_attempts: quizScore !== undefined
          ? progress.quiz_attempts + 1
          : progress.quiz_attempts,
      })
      .eq('id', progress.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get overall training stats for an advisor
  async getTrainingStats(advisorId: string): Promise<{
    totalModules: number;
    completedModules: number;
    inProgressModules: number;
    totalTimeSpent: number;
    averageQuizScore: number | null;
    completionPercentage: number;
  }> {
    const [modules, progress] = await Promise.all([
      this.getModules(),
      this.getAdvisorProgress(advisorId),
    ]);

    const completed = progress.filter(p => p.status === 'completed');
    const inProgress = progress.filter(p => p.status === 'in_progress');
    const totalTime = progress.reduce((sum, p) => sum + p.time_spent_minutes, 0);

    const quizScores = completed
      .filter(p => p.quiz_score !== null)
      .map(p => p.quiz_score as number);

    const avgScore = quizScores.length > 0
      ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length
      : null;

    return {
      totalModules: modules.length,
      completedModules: completed.length,
      inProgressModules: inProgress.length,
      totalTimeSpent: totalTime,
      averageQuizScore: avgScore,
      completionPercentage: modules.length > 0
        ? (completed.length / modules.length) * 100
        : 0,
    };
  }

  // Get advisor certifications
  async getCertifications(advisorId: string): Promise<Certification[]> {
    const { data, error } = await supabase
      .from('certifications')
      .select('*')
      .eq('advisor_id', advisorId)
      .order('issued_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Check and issue certifications based on completed training
  async checkAndIssueCertifications(advisorId: string): Promise<Certification[]> {
    // This would typically check if the advisor has completed
    // required modules for a certification and issue it automatically
    const stats = await this.getTrainingStats(advisorId);
    const issued: Certification[] = [];

    // Example: Issue "Onboarding Complete" certification at 100%
    if (stats.completionPercentage === 100) {
      const existing = await supabase
        .from('certifications')
        .select('id')
        .eq('advisor_id', advisorId)
        .eq('name', 'Onboarding Complete')
        .single();

      if (!existing.data) {
        const { data, error } = await supabase
          .from('certifications')
          .insert({
            advisor_id: advisorId,
            name: 'Onboarding Complete',
            description: 'Completed all required onboarding training modules',
            issued_at: new Date().toISOString(),
            issuer: 'MPB Health',
          })
          .select()
          .single();

        if (!error && data) {
          issued.push(data);
        }
      }
    }

    return issued;
  }

  // Get required modules that are not yet completed
  async getRequiredIncomplete(advisorId: string): Promise<TrainingModule[]> {
    const [modules, progress] = await Promise.all([
      this.getModules(),
      this.getAdvisorProgress(advisorId),
    ]);

    const completedIds = new Set(
      progress.filter(p => p.status === 'completed').map(p => p.module_id)
    );

    return modules.filter(m => m.is_required && !completedIds.has(m.id));
  }

  // Get next recommended module
  async getNextRecommendedModule(advisorId: string): Promise<TrainingModule | null> {
    const [modules, progress] = await Promise.all([
      this.getModules(),
      this.getAdvisorProgress(advisorId),
    ]);

    const progressMap = new Map(progress.map(p => [p.module_id, p]));

    // Priority: 1. In-progress modules, 2. Required not started, 3. Any not started
    const inProgress = modules.find(
      m => progressMap.get(m.id)?.status === 'in_progress'
    );
    if (inProgress) return inProgress;

    const requiredNotStarted = modules.find(
      m => m.is_required && !progressMap.has(m.id)
    );
    if (requiredNotStarted) return requiredNotStarted;

    const anyNotStarted = modules.find(m => !progressMap.has(m.id));
    return anyNotStarted || null;
  }
}

export const trainingService = new TrainingService();
