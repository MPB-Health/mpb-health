import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { FormPageLayout } from '../../components/forms/FormPageLayout';
import { formsService, recordToFormEntry } from '../../lib/formsService';
import { getFormBySlug, type FormEntry } from '../../config/forms.config';

export default function MembershipChangesForm() {
  const [formConfig, setFormConfig] = useState<FormEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadForm() {
      try {
        // Fetch from database first (same approach as DynamicFormPage / Welcome Call Survey)
        const record = await formsService.getFormBySlug('/membership-changes/');
        if (record && record.is_active) {
          setFormConfig(recordToFormEntry(record));
        } else {
          // Fallback to static config
          const staticForm = getFormBySlug('/membership-changes/');
          if (staticForm) setFormConfig(staticForm);
        }
      } catch (error) {
        console.warn('Failed to fetch from database, using static fallback:', error);
        const staticForm = getFormBySlug('/membership-changes/');
        if (staticForm) setFormConfig(staticForm);
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#0a4c8f]" />
          <p className="text-neutral-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!formConfig) return null;

  return (
    <FormPageLayout
      title={formConfig.label}
      description={formConfig.description}
      icon={formConfig.icon}
      estimatedMinutes={formConfig.estimatedMinutes}
      cognitoEmbed={formConfig.cognitoEmbed}
      slug={formConfig.slug}
    />
  );
}
