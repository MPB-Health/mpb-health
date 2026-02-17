import { supabase } from './supabase';
import { zohoCRMService, type ZohoLead } from './zohoCRMService';
import { sendLeadNotification, sendLeadWelcomeEmail } from './emailService';
import { triggerN8nWebhook } from './n8nWebhookService';
import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('LeadSubmission');

export interface LeadFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  householdSize?: number;
  currentInsurance?: string;
  monthlyPremium?: string;
  coveragePreference?: string;
  zipCode?: string;
  primaryConcern?: string;
  contactPreference?: string;

  // Routing context
  sourcePage?: string;
  sourceCTA?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;

  // Additional metadata
  formData?: Record<string, any>;
}

export interface LeadSubmissionResult {
  success: boolean;
  submissionId?: string;
  zohoLeadId?: string;
  error?: string;
  warnings?: string[];
}

class LeadSubmissionService {
  async submitLead(formData: LeadFormData): Promise<LeadSubmissionResult> {
    const warnings: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const submissionData = {
        user_id: user?.id || null,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        household_size: formData.householdSize,
        current_insurance: formData.currentInsurance,
        monthly_premium: formData.monthlyPremium,
        coverage_preference: formData.coveragePreference,
        zip_code: formData.zipCode,
        primary_concern: formData.primaryConcern,
        contact_preference: formData.contactPreference || 'phone',
        source_page: formData.sourcePage,
        source_cta: formData.sourceCTA,
        utm_source: formData.utmSource,
        utm_medium: formData.utmMedium,
        utm_campaign: formData.utmCampaign,
        utm_term: formData.utmTerm,
        utm_content: formData.utmContent,
        referrer: formData.referrer,
        form_data: formData.formData,
        zoho_sync_status: 'pending' as const,
        zoho_sync_attempts: 0,
      };

      const { data: submission, error: dbError } = await supabase
        .from('zoho_lead_submissions')
        .insert(submissionData)
        .select()
        .single();

      if (dbError) {
        console.error('Database submission error:', {
          code: dbError.code,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
        });

        if (dbError.code === 'PGRST301' || dbError.message.includes('row-level security')) {
          throw new Error('Your submission was received but could not be saved. Please contact support if this continues.');
        }

        if (dbError.code === '23505') {
          throw new Error('It looks like you already submitted this form. Please check your email.');
        }

        throw new Error(`Failed to save submission: ${dbError.message}`);
      }

      this.syncToZohoAsync(submission.id, formData).catch(error => {
        // Only log if it's a real error, not just "not configured"
        if (!String(error).includes('not configured')) {
          console.warn('Async Zoho sync warning:', error);
        }
      });

      this.sendNotificationsAsync(formData).catch(error => {
        console.error('Async notification error:', error);
        warnings.push('Email notifications may have failed');
      });

      return {
        success: true,
        submissionId: submission.id,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

    } catch (error) {
      console.error('Lead submission error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit lead',
      };
    }
  }

  private async syncToZohoAsync(submissionId: string, formData: LeadFormData): Promise<void> {
    try {
      // Check if Zoho is actually configured before attempting sync
      const configCheck = await zohoCRMService.checkConfiguration();
      if (!configCheck.configured) {
        // Silently skip if not configured - this is expected for development
        await this.updateSubmissionStatus(submissionId, 'pending', configCheck.error || 'Zoho CRM not configured');
        return;
      }

      const zohoLead: ZohoLead = {
        First_Name: formData.firstName,
        Last_Name: formData.lastName,
        Email: formData.email,
        Phone: formData.phone,
        Lead_Source: import.meta.env.VITE_ZOHO_LEAD_SOURCE || 'Website - Get a Quote',
        Lead_Status: 'New',
        Description: this.buildLeadDescription(formData),
        Zip_Code: formData.zipCode,
        Household_Size: formData.householdSize?.toString(),
        Current_Insurance: formData.currentInsurance,
        Monthly_Premium: formData.monthlyPremium,
        Coverage_Preference: formData.coveragePreference,
        Primary_Concern: formData.primaryConcern,
        Contact_Preference: formData.contactPreference,
        Submitted_From: formData.sourcePage,
      };

      await this.updateSubmissionStatus(submissionId, 'retrying');

      const result = await zohoCRMService.createLead(zohoLead);

      if (result.success && result.leadId) {
        await this.updateSubmissionStatus(
          submissionId,
          'success',
          undefined,
          result.leadId
        );

        await this.triggerSuccessWebhook(submissionId, result.leadId, formData);
      } else {
        await this.updateSubmissionStatus(
          submissionId,
          'failed',
          result.error || 'Unknown error creating lead in Zoho'
        );
      }
    } catch (error) {
      console.error('Zoho sync error:', error);
      await this.updateSubmissionStatus(
        submissionId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error during Zoho sync'
      );
    }
  }

  private buildLeadDescription(formData: LeadFormData): string {
    const parts: string[] = [];

    parts.push(`Quote request from ${formData.firstName} ${formData.lastName}`);

    if (formData.householdSize) {
      parts.push(`Household Size: ${formData.householdSize}`);
    }

    if (formData.currentInsurance) {
      parts.push(`Current Insurance: ${formData.currentInsurance}`);
    }

    if (formData.monthlyPremium) {
      parts.push(`Current Monthly Premium: ${formData.monthlyPremium}`);
    }

    if (formData.coveragePreference) {
      parts.push(`Preferred Coverage: ${formData.coveragePreference}`);
    }

    if (formData.primaryConcern) {
      parts.push(`Primary Concern: ${formData.primaryConcern}`);
    }

    if (formData.sourcePage) {
      parts.push(`\nSubmitted from: ${formData.sourcePage}`);
    }

    if (formData.sourceCTA) {
      parts.push(`Via: ${formData.sourceCTA}`);
    }

    if (formData.utmSource || formData.utmMedium || formData.utmCampaign) {
      parts.push(`\nUTM: ${formData.utmSource || ''}/${formData.utmMedium || ''}/${formData.utmCampaign || ''}`);
    }

    return parts.join('\n');
  }

  private async updateSubmissionStatus(
    submissionId: string,
    status: string,
    errorMessage?: string,
    zohoLeadId?: string
  ): Promise<void> {
    const updates: Record<string, any> = {
      zoho_sync_status: status,
      zoho_last_sync_at: new Date().toISOString(),
    };

    if (status === 'retrying' || status === 'failed') {
      const { data: current } = await supabase
        .from('zoho_lead_submissions')
        .select('zoho_sync_attempts')
        .eq('id', submissionId)
        .single();

      updates.zoho_sync_attempts = (current?.zoho_sync_attempts || 0) + 1;
    }

    if (errorMessage) {
      updates.zoho_error_message = errorMessage;
    }

    if (zohoLeadId) {
      updates.zoho_lead_id = zohoLeadId;
    }

    await supabase
      .from('zoho_lead_submissions')
      .update(updates)
      .eq('id', submissionId);
  }

  private async sendNotificationsAsync(formData: LeadFormData): Promise<void> {
    // Send notification to staff
    try {
      await sendLeadNotification({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        householdType: formData.householdSize ? `${formData.householdSize} ${formData.householdSize === 1 ? 'person' : 'people'}` : undefined,
        source: formData.sourcePage || 'Get a Quote Form',
      });
    } catch (error) {
      console.error('Staff email notification error:', error);
    }

    // Send welcome email to the lead
    try {
      await sendLeadWelcomeEmail({
        firstName: formData.firstName,
        email: formData.email,
      });
      log.info(`[LeadSubmission] Welcome email sent to ${formData.email}`);
    } catch (error) {
      console.error('Lead welcome email error:', error);
    }
  }

  private async triggerSuccessWebhook(
    submissionId: string,
    zohoLeadId: string,
    formData: LeadFormData
  ): Promise<void> {
    const webhookUrl = import.meta.env.VITE_N8N_LEAD_WEBHOOK_URL;

    if (!webhookUrl) {
      return;
    }

    try {
      await triggerN8nWebhook({
        eventType: 'lead_created',
        webhookUrl,
        data: {
          submission_id: submissionId,
          zoho_lead_id: zohoLeadId,
          lead: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            household_size: formData.householdSize,
            source: formData.sourcePage,
            cta: formData.sourceCTA,
          },
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Webhook trigger error:', error);
    }
  }

  async retryFailedSubmissions(maxAttempts: number = 3): Promise<{
    attempted: number;
    succeeded: number;
    failed: number;
  }> {
    const stats = {
      attempted: 0,
      succeeded: 0,
      failed: 0,
    };

    // First check if Zoho is configured before attempting retries
    const configCheck = await zohoCRMService.checkConfiguration();
    if (!configCheck.configured) {
      // Silently skip if not configured
      return stats;
    }

    try {
      const { data: pendingSubmissions, error } = await supabase
        .rpc('get_pending_zoho_syncs', { max_attempts: maxAttempts });

      if (error) {
        // Silently handle RPC not found (function may not exist yet)
        if (error.message?.includes('function') || error.code === 'PGRST202') {
          return stats;
        }
        console.error('Failed to get pending submissions:', error);
        return stats;
      }

      if (!pendingSubmissions || pendingSubmissions.length === 0) {
        return stats;
      }

      for (const pending of pendingSubmissions) {
        stats.attempted++;

        const { data: submission, error: fetchError } = await supabase
          .from('zoho_lead_submissions')
          .select('*')
          .eq('id', pending.id)
          .single();

        if (fetchError || !submission) {
          stats.failed++;
          continue;
        }

        const formData: LeadFormData = {
          firstName: submission.first_name,
          lastName: submission.last_name,
          email: submission.email,
          phone: submission.phone,
          householdSize: submission.household_size,
          currentInsurance: submission.current_insurance,
          monthlyPremium: submission.monthly_premium,
          coveragePreference: submission.coverage_preference,
          zipCode: submission.zip_code,
          primaryConcern: submission.primary_concern,
          contactPreference: submission.contact_preference,
          sourcePage: submission.source_page,
          sourceCTA: submission.source_cta,
          utmSource: submission.utm_source,
          utmMedium: submission.utm_medium,
          utmCampaign: submission.utm_campaign,
        };

        await this.syncToZohoAsync(submission.id, formData);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: updated } = await supabase
          .from('zoho_lead_submissions')
          .select('zoho_sync_status')
          .eq('id', submission.id)
          .single();

        if (updated?.zoho_sync_status === 'success') {
          stats.succeeded++;
        } else {
          stats.failed++;
        }
      }
    } catch (error) {
      console.error('Retry failed submissions error:', error);
    }

    return stats;
  }

  async getSubmissionStats(daysBack: number = 30) {
    try {
      const { data, error } = await supabase
        .rpc('get_lead_submission_stats', { days_back: daysBack });

      if (error) {
        console.error('Failed to get submission stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get submission stats error:', error);
      return null;
    }
  }
}

export const leadSubmissionService = new LeadSubmissionService();
