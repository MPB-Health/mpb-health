import { FormPageLayout } from '../../components/forms/FormPageLayout';
import { getFormBySlug } from '../../config/forms.config';

export default function ListBillSetupForm() {
  const formConfig = getFormBySlug('/list-bill-setup/');

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
