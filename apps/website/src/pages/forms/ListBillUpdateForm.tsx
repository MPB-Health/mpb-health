import { FormPageLayout } from '../../components/forms/FormPageLayout';
import { getFormBySlug } from '../../config/forms.config';

export default function ListBillUpdateForm() {
  const formConfig = getFormBySlug('/list-bill-update/');

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
