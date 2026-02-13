import { leadSubmissionService, type LeadFormData } from './leadSubmissionService';
import { trackEvent } from './analytics';

declare global {
  interface Window {
    Cognito?: {
      forms?: {
        on?: (event: string, callback: (data: any) => void) => void;
      };
    };
  }
}

export interface CognitoFormSubmission {
  FormId: string;
  EntryId: string;
  Fields: Record<string, any>;
  SubmittedAt: string;
}

class CognitoFormsService {
  private initialized = false;
  private formId: string;
  private apiKey: string;

  constructor() {
    this.formId = import.meta.env.VITE_COGNITO_QUOTE_FORM_ID || '217';
    this.apiKey = import.meta.env.VITE_COGNITO_FORMS_API_KEY || '';
  }

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.loadScript();
    this.setupEventListeners();
    this.initialized = true;
  }

  private loadScript(): void {
    // Deprecated path: keep no-op to avoid injecting third-party script tags.
    console.warn('[Cognito Forms] Script-based embeds are disabled; use iframe embeds instead.');
  }

  private setupEventListeners(): void {
    if (!window.Cognito?.forms?.on) {
      setTimeout(() => this.setupEventListeners(), 100);
      return;
    }

    window.Cognito.forms.on('afterSubmit', (data: CognitoFormSubmission) => {
      console.log('[Cognito Forms] Form submitted:', data);
      this.handleFormSubmission(data);
    });

    window.Cognito.forms.on('formLoaded', () => {
      console.log('[Cognito Forms] Form loaded');
      trackEvent('form_view', {
        form_type: 'get_a_quote',
        form_provider: 'cognito',
      });
    });

    window.Cognito.forms.on('fieldChanged', (data: any) => {
      trackEvent('form_interaction', {
        form_type: 'get_a_quote',
        field_name: data.fieldName || 'unknown',
      });
    });

    console.log('[Cognito Forms] Event listeners configured');
  }

  private async handleFormSubmission(data: CognitoFormSubmission): Promise<void> {
    try {
      console.log('[Cognito Forms] Processing submission...', data);

      const leadData = this.mapCognitoFieldsToLeadData(data);

      trackEvent('quote_form_submit', {
        form_id: data.FormId,
        entry_id: data.EntryId,
      });

      const result = await leadSubmissionService.submitLead(leadData);

      if (result.success) {
        console.log('[Cognito Forms] Lead submitted successfully:', result);
        trackEvent('quote_form_success', {
          submission_id: result.submissionId,
          zoho_lead_id: result.zohoLeadId,
        });
      } else {
        console.error('[Cognito Forms] Lead submission failed:', result.error);
        trackEvent('quote_form_error', {
          error: result.error,
        });
      }
    } catch (error) {
      console.error('[Cognito Forms] Error handling submission:', error);
      trackEvent('quote_form_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private mapCognitoFieldsToLeadData(data: CognitoFormSubmission): LeadFormData {
    const fields = data.Fields || {};

    const urlParams = new URLSearchParams(window.location.search);
    const sessionData = this.getSessionData();

    return {
      firstName: this.extractField(fields, ['FirstName', 'first_name', 'fname', 'First Name']),
      lastName: this.extractField(fields, ['LastName', 'last_name', 'lname', 'Last Name']),
      email: this.extractField(fields, ['Email', 'email', 'EmailAddress', 'email_address']),
      phone: this.extractField(fields, ['Phone', 'phone', 'PhoneNumber', 'phone_number', 'Phone Number']),
      householdSize: this.extractNumberField(fields, ['HouseholdSize', 'household_size', 'Household Size', 'household']),
      currentInsurance: this.extractField(fields, ['CurrentInsurance', 'current_insurance', 'Current Insurance Status']),
      monthlyPremium: this.extractField(fields, ['MonthlyPremium', 'monthly_premium', 'Current Premium', 'premium']),
      coveragePreference: this.extractField(fields, ['CoveragePreference', 'coverage_preference', 'Preferred Coverage', 'coverage']),
      zipCode: this.extractField(fields, ['ZipCode', 'zip_code', 'Zip', 'ZIP Code', 'postal_code']),
      primaryConcern: this.extractField(fields, ['PrimaryConcern', 'primary_concern', 'Main Concern', 'concern']),
      contactPreference: this.extractField(fields, ['ContactPreference', 'contact_preference', 'Preferred Contact Method']) || 'phone',

      sourcePage: sessionData.sourcePage || urlParams.get('source') || window.location.pathname,
      sourceCTA: sessionData.sourceCTA || urlParams.get('cta') || 'direct',
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined,
      utmTerm: urlParams.get('utm_term') || undefined,
      utmContent: urlParams.get('utm_content') || undefined,
      referrer: document.referrer || undefined,

      formData: fields,
    };
  }

  private extractField(fields: Record<string, any>, possibleNames: string[]): string {
    for (const name of possibleNames) {
      if (fields[name]) {
        return String(fields[name]);
      }
    }
    return '';
  }

  private extractNumberField(fields: Record<string, any>, possibleNames: string[]): number | undefined {
    const value = this.extractField(fields, possibleNames);
    if (!value) return undefined;

    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }

  private getSessionData(): { sourcePage?: string; sourceCTA?: string } {
    try {
      const stored = sessionStorage.getItem('mpb_lead_context');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  storeLeadContext(context: { sourcePage?: string; sourceCTA?: string; planType?: string }): void {
    try {
      sessionStorage.setItem('mpb_lead_context', JSON.stringify(context));
    } catch (error) {
      console.error('Failed to store lead context:', error);
    }
  }

  getEmbedCode(): string {
    return `<iframe src="https://www.cognitoforms.com/f/${this.apiKey}/${this.formId}" allow="payment" style="border:0;width:100%" height="1400"></iframe>`;
  }

  destroy(): void {
    const script = document.getElementById('cognito-forms-script');
    if (script) {
      script.remove();
    }
    this.initialized = false;
  }
}

export const cognitoFormsService = new CognitoFormsService();
