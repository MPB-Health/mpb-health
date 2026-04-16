import { supabase } from './supabase';

export interface AbandonedQuote {
  id: string;
  session_id: string;
  form_data: Record<string, any>;
  last_step: number;
  total_steps: number;
  email?: string;
  phone?: string;
  created_at: string;
  recovered_at?: string;
}

export const saveQuoteProgress = async (
  formData: Record<string, any>,
  currentStep: number,
  totalSteps: number,
  sessionId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('abandoned_quotes')
      .upsert({
        session_id: sessionId,
        form_data: formData,
        last_step: currentStep,
        total_steps: totalSteps,
        email: formData.email || null,
        phone: formData.phone || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'session_id'
      });

    if (error) {
      console.warn('Failed to save quote progress:', error);
    }
  } catch (err) {
    console.warn('Error saving quote progress:', err);
  }
};

export const getAbandonedQuotes = async (
  hoursAgo: number = 24
): Promise<AbandonedQuote[]> => {
  try {
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('abandoned_quotes')
      .select('id, session_id, form_data, last_step, total_steps, email, phone, created_at, recovered_at')
      .gte('created_at', cutoffTime)
      .is('recovered_at', null)
      .lt('last_step', 'total_steps');

    if (error) {
      console.error('Failed to fetch abandoned quotes:', error);
      return [];
    }

    return (data || []) as any;
  } catch (err) {
    console.error('Error fetching abandoned quotes:', err);
    return [];
  }
};

export const markQuoteRecovered = async (quoteId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('abandoned_quotes')
      .update({ recovered_at: new Date().toISOString() })
      .eq('id', quoteId);

    if (error) {
      console.warn('Failed to mark quote as recovered:', error);
    }
  } catch (err) {
    console.warn('Error marking quote as recovered:', err);
  }
};

export const triggerRecoveryEmail = async (
  email: string,
  formData: Record<string, any>,
  resumeLink: string
): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke('send-recovery-email', {
      body: {
        to: email,
        formData,
        resumeLink,
      },
    });

    if (error) {
      console.warn('Failed to trigger recovery email:', error);
    }
  } catch (err) {
    console.warn('Error triggering recovery email:', err);
  }
};
