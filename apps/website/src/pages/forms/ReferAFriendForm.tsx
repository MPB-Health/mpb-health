import { FormPageLayout } from '../../components/forms/FormPageLayout';
import { getFormBySlug } from '../../config/forms.config';

export default function ReferAFriendForm() {
  const formConfig = getFormBySlug('/refer-a-friend/');
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
