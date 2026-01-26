import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { FormPageLayout } from '../../components/forms/FormPageLayout';
import { formsService, recordToFormEntry, type CognitoFormRecord } from '../../lib/formsService';

/**
 * Dynamic Form Page - Renders any form from the database based on URL slug
 * This component handles forms created through the Forms Manager CMS
 */
export default function DynamicFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<CognitoFormRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadForm() {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // The slug from URL params might not have slashes
        // Try multiple formats to find the form
        const slugVariants = [
          `/${slug}/`,
          `/${slug}`,
          slug,
          slug.endsWith('/') ? slug : `${slug}/`,
        ];

        let formRecord: CognitoFormRecord | null = null;
        
        for (const variant of slugVariants) {
          formRecord = await formsService.getFormBySlug(variant);
          if (formRecord) break;
        }
        
        if (formRecord && formRecord.is_active) {
          setForm(formRecord);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error loading form:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [slug]);

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

  if (notFound || !form) {
    // Redirect to 404 or forms index
    return <Navigate to="/member/forms" replace />;
  }

  const formEntry = recordToFormEntry(form);

  return (
    <FormPageLayout
      title={formEntry.label}
      description={formEntry.description}
      icon={formEntry.icon}
      estimatedMinutes={formEntry.estimatedMinutes}
      cognitoEmbed={formEntry.cognitoEmbed}
      slug={formEntry.slug}
    />
  );
}
