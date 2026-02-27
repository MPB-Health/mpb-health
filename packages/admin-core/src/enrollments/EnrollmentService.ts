import { supabase } from '@mpbhealth/database';
import type { Enrollment, EnrollmentDocument } from '../types';

export class EnrollmentService {
  // Get all enrollments with filters
  async getEnrollments(filters?: {
    status?: string;
    type?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<Enrollment[]> {
    let query = supabase
      .from('enrollments')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      query = query.eq('application_type', filters.type);
    }
    if (filters?.search) {
      query = query.or(
        `applicant_name.ilike.%${filters.search}%,applicant_email.ilike.%${filters.search}%`
      );
    }
    if (filters?.fromDate) {
      query = query.gte('submitted_at', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.lte('submitted_at', filters.toDate);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Enrollments table query failed:', error.message);
      return [];
    }
    return data || [];
  }

  // Get pending enrollments
  async getPendingEnrollments(): Promise<Enrollment[]> {
    return this.getEnrollments({ status: 'pending' });
  }

  // Get enrollment by ID
  async getEnrollment(enrollmentId: string): Promise<Enrollment | null> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Enrollment lookup failed:', error.message);
      return null;
    }
    return data;
  }

  // Update enrollment status
  async updateStatus(
    enrollmentId: string,
    status: Enrollment['status'],
    reviewerId: string,
    notes?: string
  ): Promise<Enrollment> {
    const updates: Partial<Enrollment> = {
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    };

    if (notes) {
      updates.notes = notes;
    }

    const { data, error } = await supabase
      .from('enrollments')
      .update(updates)
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Approve enrollment
  async approve(
    enrollmentId: string,
    reviewerId: string,
    notes?: string
  ): Promise<Enrollment> {
    const enrollment = await this.updateStatus(
      enrollmentId,
      'approved',
      reviewerId,
      notes
    );

    // Trigger onboarding process based on application type
    await this.triggerOnboarding(enrollment);

    return enrollment;
  }

  // Reject enrollment
  async reject(
    enrollmentId: string,
    reviewerId: string,
    reason: string
  ): Promise<Enrollment> {
    return this.updateStatus(enrollmentId, 'rejected', reviewerId, reason);
  }

  // Put enrollment on hold
  async putOnHold(
    enrollmentId: string,
    reviewerId: string,
    reason: string
  ): Promise<Enrollment> {
    return this.updateStatus(enrollmentId, 'on_hold', reviewerId, reason);
  }

  // Start review
  async startReview(
    enrollmentId: string,
    reviewerId: string
  ): Promise<Enrollment> {
    return this.updateStatus(enrollmentId, 'in_review', reviewerId);
  }

  // Verify document
  async verifyDocument(
    enrollmentId: string,
    documentId: string,
    verifierId: string,
    status: 'verified' | 'rejected'
  ): Promise<Enrollment> {
    const enrollment = await this.getEnrollment(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const documents = enrollment.documents.map((doc) => {
      if (doc.id === documentId) {
        return {
          ...doc,
          status,
          verified_at: new Date().toISOString(),
          verified_by: verifierId,
        };
      }
      return doc;
    });

    const { data, error } = await supabase
      .from('enrollments')
      .update({ documents })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Add note to enrollment
  async addNote(enrollmentId: string, note: string): Promise<Enrollment> {
    const enrollment = await this.getEnrollment(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const existingNotes = enrollment.notes || '';
    const timestamp = new Date().toISOString();
    const newNotes = `${existingNotes}\n[${timestamp}] ${note}`.trim();

    const { data, error } = await supabase
      .from('enrollments')
      .update({ notes: newNotes })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get enrollment stats
  async getStats(): Promise<{
    total: number;
    pending: number;
    inReview: number;
    approved: number;
    rejected: number;
    onHold: number;
    byType: Record<string, number>;
  }> {
    const enrollments = await this.getEnrollments();

    const stats = {
      total: enrollments.length,
      pending: enrollments.filter((e) => e.status === 'pending').length,
      inReview: enrollments.filter((e) => e.status === 'in_review').length,
      approved: enrollments.filter((e) => e.status === 'approved').length,
      rejected: enrollments.filter((e) => e.status === 'rejected').length,
      onHold: enrollments.filter((e) => e.status === 'on_hold').length,
      byType: {} as Record<string, number>,
    };

    enrollments.forEach((enrollment) => {
      stats.byType[enrollment.application_type] =
        (stats.byType[enrollment.application_type] || 0) + 1;
    });

    return stats;
  }

  // Trigger onboarding based on application type
  private async triggerOnboarding(enrollment: Enrollment): Promise<void> {
    switch (enrollment.application_type) {
      case 'advisor':
        // Create advisor profile
        await supabase.from('advisor_profiles').insert({
          email: enrollment.applicant_email,
          first_name: enrollment.applicant_name.split(' ')[0],
          last_name: enrollment.applicant_name.split(' ').slice(1).join(' '),
          phone: enrollment.applicant_phone,
          status: 'pending',
          onboarding_completed: false,
        });
        break;
      case 'member':
        // Create member record
        await supabase.from('members').insert({
          email: enrollment.applicant_email,
          name: enrollment.applicant_name,
          phone: enrollment.applicant_phone,
          status: 'active',
        });
        break;
      default:
        break;
    }
  }

  // Subscribe to new enrollments
  subscribeToEnrollments(callback: (enrollment: Enrollment) => void) {
    return supabase
      .channel('enrollments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'enrollments',
        },
        (payload) => {
          callback(payload.new as Enrollment);
        }
      )
      .subscribe();
  }
}

export const enrollmentService = new EnrollmentService();
